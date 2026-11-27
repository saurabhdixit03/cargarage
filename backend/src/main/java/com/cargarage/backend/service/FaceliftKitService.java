package com.cargarage.backend.service;

import com.cargarage.backend.dto.request.FaceliftKitRequest;
import com.cargarage.backend.dto.response.FaceliftKitResponse;
import com.cargarage.backend.entity.Car;
import com.cargarage.backend.entity.FaceliftKit;
import com.cargarage.backend.exception.ResourceNotFoundException;
import com.cargarage.backend.repository.CarRepository;
import com.cargarage.backend.repository.FaceliftKitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FaceliftKitService {

    private final FaceliftKitRepository faceliftKitRepository;
    private final CarRepository carRepository;

    // Admin view: every kit, including switched-off ones
    @Transactional(readOnly = true)
    public List<FaceliftKitResponse> listAll() {
        return faceliftKitRepository.findAll(Sort.by("kitName")).stream()
                .map(FaceliftKitResponse::from)
                .toList();
    }

    // Public browsing. Empty filters are ignored.
    @Transactional(readOnly = true)
    public List<FaceliftKitResponse> listActive(String make, String model) {
        return faceliftKitRepository.findActive(blankToNull(make), blankToNull(model)).stream()
                .map(FaceliftKitResponse::from)
                .toList();
    }

    // Kits that fit one of the customer's own cars. Someone else's car gets the usual 404.
    @Transactional(readOnly = true)
    public List<FaceliftKitResponse> listForMyCar(Long customerId, Long carId) {
        Car car = carRepository.findByIdAndCustomerId(carId, customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Car " + carId + " not found"));
        return faceliftKitRepository.findActive(car.getMake(), car.getModel()).stream()
                .map(FaceliftKitResponse::from)
                .toList();
    }

    @Transactional
    public FaceliftKitResponse create(FaceliftKitRequest request) {
        FaceliftKit kit = new FaceliftKit();
        applyChanges(kit, request);
        return FaceliftKitResponse.from(faceliftKitRepository.save(kit));
    }

    @Transactional
    public FaceliftKitResponse update(Long kitId, FaceliftKitRequest request) {
        FaceliftKit kit = findOrThrow(kitId);
        applyChanges(kit, request);
        return FaceliftKitResponse.from(kit);
    }

    @Transactional
    public FaceliftKitResponse setActive(Long kitId, boolean active) {
        FaceliftKit kit = findOrThrow(kitId);
        kit.setActive(active);
        return FaceliftKitResponse.from(kit);
    }

    private FaceliftKit findOrThrow(Long kitId) {
        return faceliftKitRepository.findById(kitId)
                .orElseThrow(() -> new ResourceNotFoundException("Facelift kit " + kitId + " not found"));
    }

    private void applyChanges(FaceliftKit kit, FaceliftKitRequest request) {
        kit.setKitName(request.kitName().trim());
        kit.setCarMake(request.carMake().trim());
        kit.setCarModel(request.carModel().trim());
        kit.setDescription(request.description().trim());
        kit.setPrice(request.price().setScale(2, RoundingMode.HALF_UP));
        // Replace the list's contents. @OrderColumn keeps the photos in the order the admin sent them.
        kit.getImageUrls().clear();
        request.imageUrls().forEach(url -> kit.getImageUrls().add(url.trim()));
    }

    private static String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}