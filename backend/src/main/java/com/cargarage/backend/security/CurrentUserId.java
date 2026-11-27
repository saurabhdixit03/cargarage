package com.cargarage.backend.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// Put this on a controller parameter to receive the logged-in user's id as a Long.
// It's a meta-annotation: Spring Security finds the @AuthenticationPrincipal below and runs its
// expression on the verified Jwt, which means Long.valueOf(jwt.getSubject()).
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal(expression = "T(java.lang.Long).valueOf(subject)")
public @interface CurrentUserId {
}