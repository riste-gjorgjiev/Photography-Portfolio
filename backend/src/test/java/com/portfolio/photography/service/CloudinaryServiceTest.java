package com.portfolio.photography.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.portfolio.photography.exception.ExternalServiceException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CloudinaryServiceTest {

    @Test
    void demoCloudUsesDataUriFallback() {
        CloudinaryService service = new CloudinaryService(mock(Cloudinary.class));
        ReflectionTestUtils.setField(service, "cloudName", "demo");
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        CloudinaryService.UploadResult result = service.uploadPhoto(file, "night");

        assertThat(result.publicId()).startsWith("local-");
        assertThat(result.secureUrl()).startsWith("data:image/jpeg;base64,");
    }

    @Test
    void cloudinaryFailureBecomesExternalServiceException() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.uploadLarge(any(byte[].class), anyMap()))
                .thenThrow(new IOException("Invalid credentials"));

        CloudinaryService service = new CloudinaryService(cloudinary);
        ReflectionTestUtils.setField(service, "cloudName", "real-cloud");
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.uploadPhoto(file, "night"))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void cloudinaryFailureWithoutMessageUsesGenericDetail() throws IOException {
        Cloudinary cloudinary = mock(Cloudinary.class);
        Uploader uploader = mock(Uploader.class);
        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.uploadLarge(any(byte[].class), anyMap()))
                .thenThrow(new IOException());

        CloudinaryService service = new CloudinaryService(cloudinary);
        ReflectionTestUtils.setField(service, "cloudName", "real-cloud");
        MockMultipartFile file = new MockMultipartFile(
                "file", "photo.jpg", "image/jpeg", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.uploadPhoto(file, "night"))
                .isInstanceOf(ExternalServiceException.class)
                .hasMessageContaining("Check the configured credentials");
    }
}
