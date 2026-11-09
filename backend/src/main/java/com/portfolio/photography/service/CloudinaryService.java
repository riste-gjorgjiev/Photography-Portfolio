package com.portfolio.photography.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    @Value("${portfolio.cloudinary.cloud-name}")
    private String cloudName;

    public record UploadResult(String publicId, String secureUrl) {}

    public UploadResult uploadPhoto(MultipartFile file, String categorySlug) throws IOException {
        if ("demo".equalsIgnoreCase(cloudName)) {
            log.info("Cloudinary cloud-name is 'demo'; using local data-URI fallback for {}", file.getOriginalFilename());
            String mimeType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUri = "data:" + mimeType + ";base64," + base64;
            return new UploadResult("local-" + UUID.randomUUID(), dataUri);
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", "portfolio/" + categorySlug,
                        "resource_type", "image"
                )
        );

        String publicId = (String) uploadResult.get("public_id");
        String secureUrl = (String) uploadResult.get("secure_url");
        return new UploadResult(publicId, secureUrl);
    }

    public void deletePhoto(String publicId) {
        if (publicId == null || publicId.startsWith("local-") || "demo".equalsIgnoreCase(cloudName)) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.warn("Failed to delete asset {} from Cloudinary: {}", publicId, e.getMessage());
        }
    }
}
