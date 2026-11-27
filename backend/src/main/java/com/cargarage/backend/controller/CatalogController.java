package com.cargarage.backend.controller;

import com.cargarage.backend.dto.response.GarageServiceResponse;
import com.cargarage.backend.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    // Public: services customers can book
    @GetMapping
    public List<GarageServiceResponse> listActive() {
        return catalogService.listActive();
    }
}