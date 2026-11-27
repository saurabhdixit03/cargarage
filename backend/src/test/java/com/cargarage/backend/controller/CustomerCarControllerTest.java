package com.cargarage.backend.controller;

import com.cargarage.backend.config.SecurityConfig;
import com.cargarage.backend.dto.response.CarResponse;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.service.CarService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// A "slice" test: only the web layer starts (this controller, the exception handler and our real security rules).
// No database and no server. The service underneath is a Mockito mock.
@WebMvcTest(controllers = CustomerCarController.class,
        // A throwaway test key (32 bytes, Base64). Never the real JWT_SECRET.
        properties = "app.jwt.secret=dGVzdC1zZWNyZXQtdGVzdC1zZWNyZXQtdGVzdC0xMjM=")
@Import(SecurityConfig.class)
class CustomerCarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // Replaces the real CarService bean with a mock for these tests
    @MockitoBean
    private CarService carService;

    // A request carrying a valid token for this customer id, like the one our login issues
    private static JwtRequestPostProcessor customer(long id) {
        return jwt().jwt(token -> token.subject(String.valueOf(id)))
                .authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
    }

    @Test
    @DisplayName("No token: 401 with our JSON error, and the service is never called")
    void noTokenGives401() throws Exception {
        mockMvc.perform(get("/api/customers/me/cars"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.title").value("Unauthorized"));
        verifyNoInteractions(carService);
    }

    @Test
    @DisplayName("An admin token can't use customer URLs: 403")
    void adminTokenGives403() throws Exception {
        mockMvc.perform(get("/api/customers/me/cars")
                        .with(jwt().jwt(token -> token.subject("1"))
                                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isForbidden());
        verifyNoInteractions(carService);
    }

    @Test
    @DisplayName("The customer id comes from the token, not from the URL or body")
    void customerIdComesFromToken() throws Exception {
        when(carService.listMyCars(7L))
                .thenReturn(List.of(new CarResponse(3L, "Tata", "Nexon", "Grey", "MH14XY4321")));

        mockMvc.perform(get("/api/customers/me/cars").with(customer(7)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].licensePlate").value("MH14XY4321"));
        // The service was asked for customer 7: the id written in the token
        verify(carService).listMyCars(7L);
    }

    @Test
    @DisplayName("Invalid input: 400 listing every bad field, and the service is never called")
    void invalidCarGives400WithFieldErrors() throws Exception {
        String body = """
                {"make": "", "model": "Swift", "color": "Blue", "licensePlate": "ABC"}
                """;

        mockMvc.perform(post("/api/customers/me/cars").with(customer(1))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.make").value("Make is required"))
                .andExpect(jsonPath("$.errors.licensePlate").value("License plate must look like MH12AB1234"));
        verifyNoInteractions(carService);
    }

    @Test
    @DisplayName("Someone else's car: 404, exactly like a car that doesn't exist")
    void someoneElsesCarGives404() throws Exception {
        doThrow(new ResourceNotFoundException("Car 1 not found")).when(carService).deleteCar(2L, 1L);

        mockMvc.perform(delete("/api/customers/me/cars/1").with(customer(2)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Car 1 not found"));
    }
}