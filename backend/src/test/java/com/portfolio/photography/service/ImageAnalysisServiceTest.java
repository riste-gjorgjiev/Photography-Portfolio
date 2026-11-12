package com.portfolio.photography.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import static org.junit.jupiter.api.Assertions.*;

class ImageAnalysisServiceTest {

    private ImageAnalysisService service;

    @BeforeEach
    void setUp() {
        service = new ImageAnalysisService();
    }

    @Test
    void analyze_extractsCorrectDimensions() throws Exception {
        // Create a 200x150 image with vibrant colors
        BufferedImage image = new BufferedImage(200, 150, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Top half: vibrant magenta
        g.setColor(new Color(255, 0, 128));
        g.fillRect(0, 0, 200, 75);

        // Bottom half: vibrant cyan
        g.setColor(new Color(0, 200, 255));
        g.fillRect(0, 75, 200, 75);

        g.dispose();

        // Encode to PNG bytes
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        MockMultipartFile file = new MockMultipartFile(
                "test-image", "test-image.png", "image/png", imageBytes
        );

        // Analyze
        ImageAnalysisService.AnalyzedImageMetadata result = service.analyze(file, "#3B82F6");

        // Assert dimensions
        assertEquals(200, result.width(), "Width should be 200");
        assertEquals(150, result.height(), "Height should be 150");

        // Assert hex colors are valid format (#RRGGBB)
        assertNotNull(result.dominantHexPrimary(), "Primary hex should not be null");
        assertNotNull(result.dominantHexSecondary(), "Secondary hex should not be null");
        assertTrue(result.dominantHexPrimary().matches("^#[0-9A-Fa-f]{6}$"),
                "Primary hex should match #RRGGBB format: " + result.dominantHexPrimary());
        assertTrue(result.dominantHexSecondary().matches("^#[0-9A-Fa-f]{6}$"),
                "Secondary hex should match #RRGGBB format: " + result.dominantHexSecondary());
    }

    @Test
    void analyze_returnsFallbackHexForInvalidImage() {
        // Empty bytes — should gracefully fall back
        MockMultipartFile file = new MockMultipartFile(
                "empty", "empty.png", "image/png", new byte[0]
        );

        ImageAnalysisService.AnalyzedImageMetadata result = service.analyze(file, "#FF5733");

        // Should use fallback primary
        assertEquals("#FF5733", result.dominantHexPrimary(), "Should use fallback hex for invalid image");
        assertEquals("#1D4ED8", result.dominantHexSecondary(), "Should use default secondary hex");
    }

    @Test
    void analyze_handlesNullFallbackHex() throws Exception {
        BufferedImage image = new BufferedImage(100, 100, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(100, 150, 200));
        g.fillRect(0, 0, 100, 100);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        MockMultipartFile file = new MockMultipartFile(
                "test", "test.png", "image/png", imageBytes
        );

        // Pass null fallback — should not throw
        assertDoesNotThrow(() -> {
            ImageAnalysisService.AnalyzedImageMetadata result = service.analyze(file, null);
            assertNotNull(result.dominantHexPrimary());
            assertTrue(result.dominantHexPrimary().matches("^#[0-9A-Fa-f]{6}$"));
        });
    }
}
