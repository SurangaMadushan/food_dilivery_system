package com.example.foodiesapi.controller;

import com.example.foodiesapi.io.OrderRequest;
import com.example.foodiesapi.io.OrderResponse;
import com.example.foodiesapi.service.OrderService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@AllArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /**
     * 1. INITIATE PAYMENT
     * Replaces the old Razorpay create method.
     * Instead of creating an order on the server, this generates the MD5 Hash
     * and returns the data needed for the PayHere frontend script.
     */
    @PostMapping("/create")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> createOrderWithPayHere(@RequestBody OrderRequest request) {
        // You need to update your OrderService to have this method
        return orderService.initiatePayHereCheckout(request);
    }

    /**
     * 2. NOTIFY URL (Web_hook)
     * PayHere sends a POST request here when payment completes.
     * IMPORTANT: PayHere sends data as 'application/x-www-form-urlencoded', NOT JSON.
     * So we use @RequestParam instead of @RequestBody.
     */
    @PostMapping(value = "/notify", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public void verifyPayment(@RequestParam Map<String, String> paymentData) {
        System.out.println("PayHere Notification Received: " + paymentData);
        orderService.handlePayHereNotification(paymentData);
    }

    // --- Standard Endpoints (These usually stay the same) ---

    @GetMapping
    public List<OrderResponse> getOrders() {
        return orderService.getUserOrders();
    }

    @DeleteMapping("/{orderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable String orderId) {
        orderService.removeOrder(orderId);
    }

    // --- Admin Panel Endpoints ---

    @GetMapping("/all")
    public List<OrderResponse> getOrdersOfAllUsers() {
        return orderService.getOrdersOfAllUsers();
    }

    @PatchMapping("/status/{orderId}")
    public void updateOrderStatus(@PathVariable String orderId, @RequestParam String status) {
        orderService.updateOrderStatus(orderId, status);
    }
}