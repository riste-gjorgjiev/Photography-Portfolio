package com.portfolio.photography.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;

class ImageOptimizationServiceTest {

    private ImageOptimizationService service() {
        ImageOptimizationService service = new ImageOptimizationService();
        ReflectionTestUtils.setField(service, "maxDimension", 3200);
        ReflectionTestUtils.setField(service, "jpegQuality", 0.9d);
        ReflectionTestUtils.setField(service, "maxBytes", 9 * 1024 * 1024);
        return service;
    }

    @Test
    void oversizedPhotoIsDownscaledAndFitsCloudinaryLimit() throws Exception {
        // Noisy 5000x3500 JPEG: compresses to well over Cloudinary's 10 MiB cap.
        BufferedImage large = new BufferedImage(5000, 3500, BufferedImage.TYPE_INT_RGB);
        Random random = new Random(42);
        for (int y = 0; y < large.getHeight(); y++) {
            for (int x = 0; x < large.getWidth(); x++) {
                large.setRGB(x, y, random.nextInt(0xFFFFFF));
            }
        }
        ByteArrayOutputStream originalOut = new ByteArrayOutputStream();
        ImageIO.write(large, "jpg", originalOut);
        byte[] original = originalOut.toByteArray();
        assertThat(original.length).isGreaterThan(10 * 1024 * 1024);

        ImageOptimizationService.OptimizedImage optimized =
                service().optimize(original, "image/jpeg", "IMG_8303.jpg");

        assertThat(optimized.contentType()).isEqualTo("image/jpeg");
        assertThat(optimized.filename()).isEqualTo("IMG_8303.jpg");
        assertThat(optimized.bytes().length).isLessThanOrEqualTo(9 * 1024 * 1024);

        BufferedImage result = ImageIO.read(new java.io.ByteArrayInputStream(optimized.bytes()));
        assertThat(Math.max(result.getWidth(), result.getHeight())).isLessThanOrEqualTo(3200);
    }

    @Test
    void smallPhotoPassesThroughUntouched() throws Exception {
        BufferedImage small = new BufferedImage(800, 600, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(small, "jpg", out);
        byte[] original = out.toByteArray();

        ImageOptimizationService.OptimizedImage optimized =
                service().optimize(original, "image/jpeg", "small.jpg");

        assertThat(optimized.bytes()).isSameAs(original);
        assertThat(optimized.contentType()).isEqualTo("image/jpeg");
    }

    @Test
    void unreadableBytesFallBackToOriginal() {
        byte[] garbage = "not-an-image".getBytes();

        ImageOptimizationService.OptimizedImage optimized =
                service().optimize(garbage, "image/jpeg", "broken.jpg");

        assertThat(optimized.bytes()).isSameAs(garbage);
    }
}