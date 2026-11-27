package com.cargarage.backend.controller;

import com.cargarage.backend.dto.response.DiscountResponse;
import com.cargarage.backend.security.CurrentUserId;
import com.cargarage.backend.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/customers/me/discounts")
@RequiredArgsConstructor
public class CustomerDiscountController {

    private final DiscountService discountService;

    @GetMapping
    public List<DiscountResponse> listMyDiscounts(@CurrentUserId Long customerId) {
        return discountService.listForCustomer(customerId);
    }
}