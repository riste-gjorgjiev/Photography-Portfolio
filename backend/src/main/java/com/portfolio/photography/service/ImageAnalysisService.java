package com.portfolio.photography.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.jpeg.JpegDirectory;
import com.drew.metadata.png.PngDirectory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.Instant;
import java.util.Date;
import java.util.TimeZone;

@Service
@Slf4j
public class ImageAnalysisService {

    public record AnalyzedImageMetadata(
            int width,
            int height,
            String dominantHexPrimary,
            String dominantHexSecondary,
            String cameraModel,
            String lensModel,
            String focalLength,
            String aperture,
            String shutterSpeed,
            Integer iso,
            Instant capturedAt
    ) {}

    public AnalyzedImageMetadata analyze(MultipartFile file, String fallbackHex) {
        String defaultPrimary = (fallbackHex != null && fallbackHex.matches("^#[0-9A-Fa-f]{6}$"))
                ? fallbackHex : "#3B82F6";
        String defaultSecondary = "#1D4ED8";

        int width = 1920;
        int height = 1280;
        String primaryHex = defaultPrimary;
        String secondaryHex = defaultSecondary;

        String cameraModel = null;
        String lensModel = null;
        String focalLength = null;
        String aperture = null;
        String shutterSpeed = null;
        Integer iso = null;
        Instant capturedAt = null;

        try {
            byte[] bytes = file.getBytes();

            try (InputStream imgStream = new ByteArrayInputStream(bytes)) {
                BufferedImage image = ImageIO.read(imgStream);
                if (image != null) {
                    width = image.getWidth();
                    height = image.getHeight();
                    String[] palette = extractAmbientPalette(image, defaultPrimary, defaultSecondary);
                    primaryHex = palette[0];
                    secondaryHex = palette[1];
                }
            } catch (Exception e) {
                log.warn("BufferedImage color extraction skipped for {}: {}", file.getOriginalFilename(), e.getMessage());
            }

            try (InputStream metaStream = new ByteArrayInputStream(bytes)) {
                Metadata metadata = ImageMetadataReader.readMetadata(metaStream);

                ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
                if (ifd0 != null) {
                    String make = trimOrNull(ifd0.getString(ExifIFD0Directory.TAG_MAKE));
                    String model = trimOrNull(ifd0.getString(ExifIFD0Directory.TAG_MODEL));
                    if (make != null && model != null) {
                        cameraModel = model.toLowerCase().startsWith(make.toLowerCase()) ? model : make + " " + model;
                    } else {
                        cameraModel = model != null ? model : make;
                    }
                }

                ExifSubIFDDirectory subIfd = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
                if (subIfd != null) {
                    lensModel = trimOrNull(subIfd.getString(ExifSubIFDDirectory.TAG_LENS_MODEL));
                    focalLength = trimOrNull(subIfd.getDescription(ExifSubIFDDirectory.TAG_FOCAL_LENGTH));
                    aperture = trimOrNull(subIfd.getDescription(ExifSubIFDDirectory.TAG_FNUMBER));
                    shutterSpeed = trimOrNull(subIfd.getDescription(ExifSubIFDDirectory.TAG_EXPOSURE_TIME));
                    iso = subIfd.getInteger(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT);

                    Date dateOriginal = subIfd.getDateOriginal(TimeZone.getDefault());
                    if (dateOriginal != null) {
                        capturedAt = dateOriginal.toInstant();
                    }
                }

                if (width == 1920 && height == 1280) {
                    JpegDirectory jpegDir = metadata.getFirstDirectoryOfType(JpegDirectory.class);
                    if (jpegDir != null && jpegDir.getImageWidth() > 0 && jpegDir.getImageHeight() > 0) {
                        width = jpegDir.getImageWidth();
                        height = jpegDir.getImageHeight();
                    } else {
                        PngDirectory pngDir = metadata.getFirstDirectoryOfType(PngDirectory.class);
                        if (pngDir != null && pngDir.containsTag(PngDirectory.TAG_IMAGE_WIDTH)) {
                            width = pngDir.getInt(PngDirectory.TAG_IMAGE_WIDTH);
                            height = pngDir.getInt(PngDirectory.TAG_IMAGE_HEIGHT);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("EXIF metadata parsing skipped for {}: {}", file.getOriginalFilename(), e.getMessage());
            }

        } catch (Exception e) {
            log.error("Failed reading bytes from uploaded file {}", file.getOriginalFilename(), e);
        }

        return new AnalyzedImageMetadata(
                width,
                height,
                primaryHex,
                secondaryHex,
                cameraModel,
                lensModel,
                focalLength,
                aperture,
                shutterSpeed,
                iso,
                capturedAt
        );
    }

    private String[] extractAmbientPalette(BufferedImage image, String fallbackPrimary, String fallbackSecondary) {
        int w = image.getWidth();
        int h = image.getHeight();
        int stepX = Math.max(1, w / 24);
        int stepY = Math.max(1, h / 24);

        long r1 = 0, g1 = 0, b1 = 0, w1 = 0;
        long r2 = 0, g2 = 0, b2 = 0, w2 = 0;

        for (int y = 0; y < h; y += stepY) {
            for (int x = 0; x < w; x += stepX) {
                int rgb = image.getRGB(x, y);
                int r = (rgb >> 16) & 0xFF;
                int g = (rgb >> 8) & 0xFF;
                int b = rgb & 0xFF;

                float[] hsb = Color.RGBtoHSB(r, g, b, null);
                float saturation = hsb[1];
                float brightness = hsb[2];

                if (brightness < 0.10f || brightness > 0.96f) {
                    continue;
                }

                long weight = 1 + Math.round(saturation * 10.0f);
                if (y < h / 2) {
                    r1 += r * weight;
                    g1 += g * weight;
                    b1 += b * weight;
                    w1 += weight;
                } else {
                    r2 += r * weight;
                    g2 += g * weight;
                    b2 += b * weight;
                    w2 += weight;
                }
            }
        }

        String primary = w1 > 0
                ? boostAmbientColor((int) (r1 / w1), (int) (g1 / w1), (int) (b1 / w1))
                : fallbackPrimary;
        String secondary = w2 > 0
                ? boostAmbientColor((int) (r2 / w2), (int) (g2 / w2), (int) (b2 / w2))
                : fallbackSecondary;

        return new String[]{primary, secondary};
    }

    private String boostAmbientColor(int r, int g, int b) {
        float[] hsb = Color.RGBtoHSB(r, g, b, null);
        float boostedSat = Math.min(1.0f, Math.max(hsb[1], 0.45f) * 1.15f);
        float boostedBri = Math.min(0.90f, Math.max(hsb[2], 0.45f));
        int rgb = Color.HSBtoRGB(hsb[0], boostedSat, boostedBri);
        return String.format("#%06X", (0xFFFFFF & rgb));
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
