package com.cargarage.backend.controller;

import com.cargarage.backend.dto.response.FaceliftKitResponse;
import com.cargarage.backend.security.CurrentUserId;
import com.cargarage.backend.service.FaceliftKitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// "Which kits fit MY car?" Lives under the car, as a sub-resource.
@RestController
@RequestMapping("/api/customers/me/cars/{carId}/facelift-kits")
@RequiredArgsConstructor
public class CustomerFaceliftKitController {

    private final FaceliftKitService faceliftKitService;

    @GetMapping
    public List<FaceliftKitResponse> listForMyCar(@CurrentUserId Long customerId, @PathVariable Long carId) {
        return faceliftKitService.listForMyCar(customerId, carId);
    }
}