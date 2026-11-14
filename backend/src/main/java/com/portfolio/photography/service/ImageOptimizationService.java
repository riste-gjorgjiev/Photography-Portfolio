package com.portfolio.photography.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;

/**
 * Shrinks oversized photos before they are stored in Cloudinary.
 *
 * Cloudinary's free plan rejects any asset larger than 10 MiB ("File size too
 * large. Maximum is 10485760"), regardless of chunked uploads. Full-resolution
 * session photos routinely exceed that, so they are decoded with source
 * subsampling (bounded memory), scaled down to a web-friendly size and
 * re-encoded as JPEG. EXIF is not preserved on the stored asset; the original
 * metadata has already been extracted into the database by
 * {@link ImageAnalysisService}. Files that already fit are passed through
 * untouched.
 */
@Service
@Slf4j
public class ImageOptimizationService {

    /** Upper bound for the decoded buffer; keeps the JVM heap usage low on small hosts. */
    private static final int MAX_DECODE_DIMENSION = 4200;
    private static final float MIN_QUALITY = 0.55f;
    private static final int MIN_DIMENSION = 1200;

    @Value("${portfolio.upload.max-dimension:3200}")
    private int maxDimension;

    @Value("${portfolio.upload.jpeg-quality:0.9}")
    private double jpegQuality;

    @Value("${portfolio.upload.max-bytes:9437184}")
    private int maxBytes;

    public record OptimizedImage(byte[] bytes, String contentType, String filename) {}

    public OptimizedImage optimize(byte[] original, String contentType, String filename) {
        if (original == null || original.length == 0) {
            return passthrough(original, contentType, filename);
        }

        String normalisedType = contentType != null ? contentType.toLowerCase() : "";
        boolean supported = normalisedType.contains("jpeg")
                || normalisedType.contains("jpg")
                || normalisedType.contains("png");
        if (!supported) {
            return passthrough(original, contentType, filename);
        }

        try {
            int[] dimensions = readDimensions(original);
            if (dimensions == null) {
                return passthrough(original, contentType, filename);
            }

            boolean withinDimensions = dimensions[0] <= maxDimension && dimensions[1] <= maxDimension;
            if (withinDimensions && original.length <= maxBytes) {
                log.info("Upload {} ({}x{}, {} bytes) is already within limits; storing as-is",
                        filename, dimensions[0], dimensions[1], original.length);
                return passthrough(original, contentType, filename);
            }

            BufferedImage decoded = decodeSubsampled(original);
            if (decoded == null) {
                return passthrough(original, contentType, filename);
            }

            BufferedImage scaled = scaleToFit(decoded, maxDimension);
            float quality = (float) jpegQuality;
            byte[] encoded = encodeJpeg(scaled, quality);

            while (encoded.length > maxBytes && quality > MIN_QUALITY) {
                quality = Math.max(MIN_QUALITY, quality - 0.1f);
                encoded = encodeJpeg(scaled, quality);
            }
            while (encoded.length > maxBytes
                    && Math.max(scaled.getWidth(), scaled.getHeight()) > MIN_DIMENSION) {
                scaled = scaleToFit(scaled, (int) Math.round(Math.max(scaled.getWidth(), scaled.getHeight()) * 0.85));
                encoded = encodeJpeg(scaled, quality);
            }

            String outputName = withJpegExtension(filename);
            log.info("Optimized upload {}: {}x{} {} bytes -> {}x{} {} bytes (JPEG q={})",
                    filename, dimensions[0], dimensions[1], original.length,
                    scaled.getWidth(), scaled.getHeight(), encoded.length, String.format("%.2f", quality));

            return new OptimizedImage(encoded, "image/jpeg", outputName);
        } catch (Exception e) {
            log.warn("Image optimization skipped for {}: {}", filename, e.getMessage());
            return passthrough(original, contentType, filename);
        }
    }

    private OptimizedImage passthrough(byte[] bytes, String contentType, String filename) {
        return new OptimizedImage(bytes, contentType, filename);
    }

    private int[] readDimensions(byte[] bytes) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return null;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, false);
                return new int[]{reader.getWidth(0), reader.getHeight(0)};
            } finally {
                reader.dispose();
            }
        }
    }

    private BufferedImage decodeSubsampled(byte[] bytes) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return null;
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(input, true, false);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                int subsample = Math.max(1, (int) Math.ceil((double) Math.max(width, height) / MAX_DECODE_DIMENSION));
                ImageReadParam param = reader.getDefaultReadParam();
                param.setSourceSubsampling(subsample, subsample, 0, 0);
                return reader.read(0, param);
            } finally {
                reader.dispose();
            }
        }
    }

    private BufferedImage scaleToFit(BufferedImage source, int maxSize) {
        int width = source.getWidth();
        int height = source.getHeight();
        if (width <= maxSize && height <= maxSize) {
            return source;
        }
        double scale = Math.min((double) maxSize / width, (double) maxSize / height);
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));

        BufferedImage output = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = output.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return output;
    }

    private byte[] encodeJpeg(BufferedImage image, float quality) throws IOException {
        BufferedImage rgb = image;
        if (image.getType() != BufferedImage.TYPE_INT_RGB) {
            rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
            Graphics2D graphics = rgb.createGraphics();
            try {
                graphics.setColor(Color.WHITE);
                graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
                graphics.drawImage(image, 0, 0, null);
            } finally {
                graphics.dispose();
            }
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer available");
        }
        ImageWriter writer = writers.next();
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        try (ImageOutputStream imageOutput = ImageIO.createImageOutputStream(output)) {
            writer.setOutput(imageOutput);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality);
            writer.write(null, new IIOImage(rgb, null, null), param);
        } finally {
            writer.dispose();
        }
        return output.toByteArray();
    }

    private String withJpegExtension(String filename) {
        if (filename == null || filename.isBlank()) {
            return "photo.jpg";
        }
        int dot = filename.lastIndexOf('.');
        String base = dot > 0 ? filename.substring(0, dot) : filename;
        return base + ".jpg";
    }
}