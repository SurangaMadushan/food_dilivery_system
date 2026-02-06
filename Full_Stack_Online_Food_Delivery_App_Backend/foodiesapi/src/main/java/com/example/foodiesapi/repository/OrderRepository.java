package com.example.foodiesapi.repository;

import com.example.foodiesapi.entity.OrderEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends MongoRepository<OrderEntity, String> {

    // Finds all orders for a specific user (Standard)
    List<OrderEntity> findByUserId(String userId);

    // CHANGED: Replaced Razorpay ID with PayHere Payment ID
    // This is optional but helpful if you want to search by the ID PayHere gives you.
    Optional<OrderEntity> findByPayherePaymentId(String payherePaymentId);

    // NOTE: You don't need a special method to find the order during the callback.
    // PayHere sends back YOUR database ID, so you will just use the built-in findById() method.
}