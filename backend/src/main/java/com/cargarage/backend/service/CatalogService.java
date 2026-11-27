package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.GarageServiceRequest;
import com.cargarage.backend.dto.response.GarageServiceResponse;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.exception.DuplicateResourceException;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.GarageServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final GarageServiceRepository garageServiceRepository;

    // Customers see only active services
    @Transactional(readOnly = true)
    public List<GarageServiceResponse> listActive() {
        return garageServiceRepository.findByActiveTrueOrderByNameAsc().stream()
                .map(GarageServiceResponse::from)
                .toList();
    }

    // Admin sees everything, including hidden services
    @Transactional(readOnly = true)
    public List<GarageServiceResponse> listAll() {
        return garageServiceRepository.findAll(Sort.by("name")).stream()
                .map(GarageServiceResponse::from)
                .toList();
    }

    @Transactional
    public GarageServiceResponse create(GarageServiceRequest request) {
        String name = request.name().trim();
        if (garageServiceRepository.existsByName(name)) {
            throw new DuplicateResourceException("A service named '" + name + "' already exists");
        }

        GarageService service = new GarageService();
        service.setName(name);
        service.setDescription(request.description().trim());
        service.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));

        return GarageServiceResponse.from(garageServiceRepository.save(service));
    }

    @Transactional
    public GarageServiceResponse update(Long id, GarageServiceRequest request) {
        GarageService service = findOrThrow(id);

        String name = request.name().trim();
        if (garageServiceRepository.existsByNameAndIdNot(name, id)) {
            throw new DuplicateResourceException("A service named '" + name + "' already exists");
        }

        service.setName(name);
        service.setDescription(request.description().trim());
        service.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));

        // No save() call needed: changes to a loaded entity are written automatically at commit
        return GarageServiceResponse.from(service);
    }

    // Hide or show a service instead of deleting it (soft delete)
    @Transactional
    public GarageServiceResponse setActive(Long id, boolean active) {
        GarageService service = findOrThrow(id);
        service.setActive(active);
        return GarageServiceResponse.from(service);
    }

    private GarageService findOrThrow(Long id) {
        return garageServiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service " + id + " not found"));
    }
}