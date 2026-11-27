package com.cargarage.backend.controller;

import com.cargarage.backend.dto.response.FaceliftKitResponse;
import com.cargarage.backend.service.FaceliftKitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Public, like the services list: anyone can browse kits before signing up
@RestController
@RequestMapping("/api/facelift-kits")
@RequiredArgsConstructor
public class FaceliftKitController {

    private final FaceliftKitService faceliftKitService;

    // GET /api/facelift-kits?make=Hyundai&model=Creta (both filters optional, any letter case)
    @GetMapping
    public List<FaceliftKitResponse> list(@RequestParam(required = false) String make,
                                          @RequestParam(required = false) String model) {
        return faceliftKitService.listActive(make, model);
    }
}