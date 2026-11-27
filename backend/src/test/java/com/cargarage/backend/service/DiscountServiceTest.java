package com.cargarage.backend.service;

import com.cargarage.backend.entity.AppointmentItem;
import com.cargarage.backend.entity.Discount;
import com.cargarage.backend.entity.GarageService;
import com.cargarage.backend.entity.enums.CustomerType;
import com.cargarage.backend.repository.CustomerRepository;
import com.cargarage.backend.repository.DiscountRepository;
import com.cargarage.backend.repository.GarageServiceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

// Plain unit tests: no Spring, no database. The repositories are Mockito mocks, so each test runs in milliseconds.
@ExtendWith(MockitoExtension.class)
class DiscountServiceTest {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final LocalDate TODAY = LocalDate.of(2026, 12, 1);

    @Mock
    private DiscountRepository discountRepository;
    @Mock
    private GarageServiceRepository garageServiceRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private DiscountService discountService;

    private final GarageService coating = service(1L, "Ceramic Coating", "15000.00");
    private final GarageService cleaning = service(3L, "Interior Deep Cleaning", "2500.00");

    @BeforeEach
    void setUp() {
        // A fixed clock: for this service, "today" is always 1 Dec 2026
        Clock fixedClock = Clock.fixed(TODAY.atTime(10, 0).atZone(IST).toInstant(), IST);
        discountService = new DiscountService(discountRepository, garageServiceRepository,
                customerRepository, eventPublisher, fixedClock);
    }

    @Test
    @DisplayName("A discount only reduces the services it covers")
    void savingAppliesOnlyToCoveredServices() {
        // Arrange
        Discount loyalty = discount(2L, "Loyalty Offer", "20.00", coating);

        // Act
        BigDecimal saving = DiscountService.savingFor(loyalty, List.of(item(coating), item(cleaning)));

        // Assert: 20% of the 15000.00 coating only; the 2500.00 cleaning isn't covered
        assertThat(saving).isEqualTo("3000.00");
    }

    @Test
    @DisplayName("Savings are rounded to 2 decimal places, half up")
    void savingIsRoundedHalfUp() {
        GarageService polish = service(5L, "Polish", "999.99");
        Discount offer = discount(9L, "Odd Offer", "12.50", polish);

        // 999.99 x 12.5% = 124.99875, which rounds to 125.00
        assertThat(DiscountService.savingFor(offer, List.of(item(polish)))).isEqualTo("125.00");
    }

    @Test
    @DisplayName("The offer that saves the most money wins, even with a smaller percentage")
    void bestDiscountIsBiggestSavingNotBiggestPercentage() {
        Discount loyalty = discount(2L, "Loyalty Offer", "20.00", coating);              // saves 3000.00
        Discount superSaver = discount(3L, "Super Saver", "18.00", coating, cleaning);   // saves 3150.00
        // Stubbed for TODAY only: if the service used the real date instead of the clock, this would return nothing
        when(discountRepository.findAvailable(TODAY, CustomerType.REPEAT)).thenReturn(List.of(loyalty, superSaver));

        Optional<DiscountService.AppliedDiscount> best =
                discountService.findBestDiscount(CustomerType.REPEAT, List.of(item(coating), item(cleaning)));

        assertThat(best).isPresent();
        assertThat(best.get().discount().getName()).isEqualTo("Super Saver");
        assertThat(best.get().amount()).isEqualTo("3150.00");
    }

    @Test
    @DisplayName("No discount when no offer covers anything in the booking")
    void noDiscountWhenNothingIsCovered() {
        Discount loyalty = discount(2L, "Loyalty Offer", "20.00", coating);
        when(discountRepository.findAvailable(TODAY, CustomerType.REPEAT)).thenReturn(List.of(loyalty));

        assertThat(discountService.findBestDiscount(CustomerType.REPEAT, List.of(item(cleaning)))).isEmpty();
    }

    // --- Small builders for test data ---

    private static GarageService service(long id, String name, String price) {
        GarageService service = new GarageService();
        // The id has no setter (the database assigns it), so the test sets the private field directly
        ReflectionTestUtils.setField(service, "id", id);
        service.setName(name);
        service.setPrice(new BigDecimal(price));
        return service;
    }

    private static AppointmentItem item(GarageService service) {
        AppointmentItem item = new AppointmentItem();
        item.setService(service);
        item.setPrice(service.getPrice());
        return item;
    }

    private static Discount discount(long id, String name, String percentage, GarageService... services) {
        Discount discount = new Discount();
        ReflectionTestUtils.setField(discount, "id", id);
        discount.setName(name);
        discount.setPercentage(new BigDecimal(percentage));
        discount.getServices().addAll(List.of(services));
        return discount;
    }
}