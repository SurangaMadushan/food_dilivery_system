package com.example.foodiesapi.service;

import com.example.foodiesapi.entity.OrderEntity;
import com.example.foodiesapi.io.OrderRequest;
import com.example.foodiesapi.io.OrderResponse;
import com.example.foodiesapi.repository.CartRespository;
import com.example.foodiesapi.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserService userService;
    private final CartRespository cartRespository;

    // --- PAYHERE CREDENTIALS ---
    // Make sure these match what you have in application.properties
    @Value("${payhere_merchant_id}")
    private String MERCHANT_ID;

    @Value("${payhere_merchant_secret}")
    private String MERCHANT_SECRET;

    // You usually want to set this in properties too (e.g. sandbox vs live)
    // For testing: https://sandbox.payhere.lk/pay/checkout
    private final String PAYHERE_URL = "https://sandbox.payhere.lk/pay/checkout";

    /**
     * 1. INITIATE CHECKOUT
     * Creates the order in DB first, then generates the PayHere Hash.
     */
    @Override
    public Map<String, Object> initiatePayHereCheckout(OrderRequest request) {
        // A. Convert Request to Entity
        OrderEntity newOrder = convertToEntity(request);

        // B. Set current user ID
        String loggedInUserId = userService.findByUserId();
        newOrder.setUserId(loggedInUserId);
        newOrder.setCurrency("LKR"); // Default to LKR
        newOrder.setPaymentStatus("Pending");

        // C. Save to DB *FIRST* to get the generated ID
        newOrder = orderRepository.save(newOrder);

        // D. Generate PayHere Security Hash
        // Formula: MD5(merchant_id + order_id + amount_formatted + currency + MD5(secret))
        double amount = newOrder.getAmount();
        String orderId = newOrder.getId();
        String currency = "LKR";

        // IMPORTANT: PayHere requires amount to have exactly 2 decimal places (e.g., 1500.00)
        DecimalFormat df = new DecimalFormat("0.00");
        String amountFormatted = df.format(amount);

        String hash = generatePayHereHash(MERCHANT_ID, orderId, amountFormatted, currency, MERCHANT_SECRET);

        // E. Prepare Data for Frontend
        Map<String, Object> payHereData = new HashMap<>();
        payHereData.put("sandbox", true); // Set to false for production
        payHereData.put("merchant_id", MERCHANT_ID);
        payHereData.put("return_url", "http://localhost:3000/orders"); // Where user goes after success
        payHereData.put("cancel_url", "http://localhost:3000/cart");   // Where user goes after cancel
        payHereData.put("notify_url", "http://your-backend-url/api/orders/notify"); // See note below!
        payHereData.put("order_id", orderId);
        payHereData.put("items", "Food Order #" + orderId);
        payHereData.put("amount", amountFormatted);
        payHereData.put("currency", currency);
        payHereData.put("hash", hash);
        payHereData.put("first_name", "User"); // You can fetch real name from UserService
        payHereData.put("last_name", "Name");
        payHereData.put("email", newOrder.getEmail());
        payHereData.put("phone", newOrder.getPhoneNumber());
        payHereData.put("address", newOrder.getUserAddress());
        payHereData.put("city", "Colombo");
        payHereData.put("country", "Sri Lanka");

        return payHereData;
    }

    /**
     * 2. HANDLE NOTIFICATION (WebHook)
     * Called by PayHere server to confirm payment status.
     */
    @Override
    public void handlePayHereNotification(Map<String, String> paymentData) {
        String orderId = paymentData.get("order_id");
        String statusCode = paymentData.get("status_code"); // 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed
        String payHerePaymentId = paymentData.get("payment_id");
        String md5Sig = paymentData.get("md5sig"); // You should strictly verify this hash too for security

        OrderEntity existingOrder = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        if ("2".equals(statusCode)) {
            existingOrder.setPaymentStatus("Paid");
            existingOrder.setPayherePaymentId(payHerePaymentId);
            existingOrder.setOrderStatus("Placed");

            // Clear the cart only on success
            cartRespository.deleteByUserId(existingOrder.getUserId());
        } else {
            existingOrder.setPaymentStatus("Failed");
        }

        orderRepository.save(existingOrder);
    }

    // --- Standard Methods (Updated to use new Entity/Response) ---

    @Override
    public List<OrderResponse> getUserOrders() {
        String loggedInUserId = userService.findByUserId();
        List<OrderEntity> list = orderRepository.findByUserId(loggedInUserId);
        return list.stream().map(this::convertToResponse).collect(Collectors.toList());
    }

    @Override
    public void removeOrder(String orderId) {
        orderRepository.deleteById(orderId);
    }

    @Override
    public List<OrderResponse> getOrdersOfAllUsers() {
        return orderRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void updateOrderStatus(String orderId, String status) {
        OrderEntity entity = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        entity.setOrderStatus(status);
        orderRepository.save(entity);
    }

    // --- Helper Methods ---

    private String generatePayHereHash(String merchantId, String orderId, String amount, String currency, String merchantSecret) {
        // Hash Step 1: Hash the Secret
        String secretHash = getMd5(merchantSecret).toUpperCase();

        // Hash Step 2: Hash the Combined String
        // merchantID + orderID + amountFormatted + currency + UPPERCASE_MD5(secret)
        String stringToHash = merchantId + orderId + amount + currency + secretHash;

        return getMd5(stringToHash).toUpperCase();
    }

    private String getMd5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : messageDigest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating MD5 hash", e);
        }
    }

    private OrderResponse convertToResponse(OrderEntity newOrder) {
        return OrderResponse.builder()
                .id(newOrder.getId())
                .amount(newOrder.getAmount())
                .currency(newOrder.getCurrency())
                .userAddress(newOrder.getUserAddress())
                .userId(newOrder.getUserId())
                .paymentStatus(newOrder.getPaymentStatus())
                .orderStatus(newOrder.getOrderStatus())
                .email(newOrder.getEmail())
                .phoneNumber(newOrder.getPhoneNumber())
                .orderedItems(newOrder.getOrderedItems())
                .build();
    }

    private OrderEntity convertToEntity(OrderRequest request) {
        return OrderEntity.builder()
                .userAddress(request.getUserAddress())
                .amount(request.getAmount())
                .orderedItems(request.getOrderedItems())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .orderStatus(request.getOrderStatus())
                .build();
    }
}