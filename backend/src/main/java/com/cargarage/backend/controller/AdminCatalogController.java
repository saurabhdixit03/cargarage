package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.GarageServiceRequest;
import com.cargarage.backend.dto.response.GarageServiceResponse;
import com.cargarage.backend.service.CatalogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final CatalogService catalogService;

    // All services, including hidden ones
    @GetMapping
    public List<GarageServiceResponse> listAll() {
        return catalogService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GarageServiceResponse create(@Valid @RequestBody GarageServiceRequest request) {
        return catalogService.create(request);
    }

    @PutMapping("/{id}")
    public GarageServiceResponse update(@PathVariable Long id,
                                        @Valid @RequestBody GarageServiceRequest request) {
        return catalogService.update(id, request);
    }

    // e.g. PATCH /api/admin/services/3/active?value=false hides service 3
    @PatchMapping("/{id}/active")
    public GarageServiceResponse setActive(@PathVariable Long id, @RequestParam boolean value) {
        return catalogService.setActive(id, value);
    }
}