package com.portfolio.photography.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.ProblemDetail;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void maxUploadSizeReturnsPayloadTooLarge() {
        ReflectionTestUtils.setField(handler, "maxFileSize", "25MB");

        ProblemDetail problem = handler.handleMaxUploadSize(new MaxUploadSizeExceededException(25L));

        assertThat(problem.getStatus()).isEqualTo(413);
        assertThat(problem.getDetail()).contains("25MB");
    }

    @Test
    void externalServiceFailureReturnsBadGateway() {
        ProblemDetail problem = handler.handleExternalService(
                new ExternalServiceException("Image storage upload failed: Invalid credentials"));

        assertThat(problem.getStatus()).isEqualTo(502);
        assertThat(problem.getDetail()).contains("Invalid credentials");
    }
}
