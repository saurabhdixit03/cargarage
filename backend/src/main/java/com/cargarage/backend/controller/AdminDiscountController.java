package com.cargarage.backend.controller;

import com.cargarage.backend.dto.request.DiscountRequest;
import com.cargarage.backend.dto.response.DiscountResponse;
import com.cargarage.backend.service.DiscountService;
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
@RequestMapping("/api/admin/discounts")
@RequiredArgsConstructor
public class AdminDiscountController {

    private final DiscountService discountService;

    @GetMapping
    public List<DiscountResponse> listAll() {
        return discountService.listAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DiscountResponse create(@Valid @RequestBody DiscountRequest request) {
        return discountService.create(request);
    }

    @PutMapping("/{discountId}")
    public DiscountResponse update(@PathVariable Long discountId, @Valid @RequestBody DiscountRequest request) {
        return discountService.update(discountId, request);
    }

    // PATCH /api/admin/discounts/2/active?value=false
    @PatchMapping("/{discountId}/active")
    public DiscountResponse setActive(@PathVariable Long discountId, @RequestParam boolean value) {
        return discountService.setActive(discountId, value);
    }
}