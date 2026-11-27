package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.FaceliftKitRequest;
import com.cargarage.backend.dto.response.FaceliftKitResponse;
import com.cargarage.backend.service.FaceliftKitService;
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
@RequestMapping("/api/admin/facelift-kits")
@RequiredArgsConstructor
public class AdminFaceliftKitController {

    private final FaceliftKitService faceliftKitService;

    @GetMapping
    public List<FaceliftKitResponse> listAll() {
        return faceliftKitService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FaceliftKitResponse create(@Valid @RequestBody FaceliftKitRequest request) {
        return faceliftKitService.create(request);
    }

    @PutMapping("/{kitId}")
    public FaceliftKitResponse update(@PathVariable Long kitId, @Valid @RequestBody FaceliftKitRequest request) {
        return faceliftKitService.update(kitId, request);
    }

    // PATCH /api/admin/facelift-kits/2/active?value=false
    @PatchMapping("/{kitId}/active")
    public FaceliftKitResponse setActive(@PathVariable Long kitId, @RequestParam boolean value) {
        return faceliftKitService.setActive(kitId, value);
    }
}