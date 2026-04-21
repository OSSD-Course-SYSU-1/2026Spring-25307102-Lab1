/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file frame_handle.cpp
 * @brief Frame Update Handler for Animation
 * 
 * This file handles per-frame updates for tetrahedron rotation animations,
 * including constant speed rotation and damping rotation modes.
 */

#include "frame_handle.h"
#include "app_napi.h"
#include "log.h"
#include <cmath>

// ============================================================================
// Animation Constants
// ============================================================================
namespace {
    constexpr int DA_MAX = 360;           // Maximum damping animation frames
    constexpr int OMIGA_MAX = 30;         // Maximum angular velocity
    constexpr int DAMPING_FACTOR = 10;    // Damping coefficient
    constexpr float EULER_NUMBER = 2.718281828459045f;  // e constant for damping calculation
    constexpr float ROTATION_SPEED = 1.0f;  // Degrees per frame for constant rotation
    constexpr float DAMPING_INITIAL_SPEED = 5.0f;  // Initial speed multiplier for damping
}

/**
 * @brief Normalize angle to [0, 360) range
 * @param angle Input angle in degrees
 * @return Normalized angle in [0, 360) range
 */
static int Normalize(int angle)
{
    int ret = angle % CIRCUMFERENCE_DEGREE;
    if (ret < 0) {
        ret += CIRCUMFERENCE_DEGREE;
    }
    return ret;
}

// ============================================================================
// FrameHandle Implementation
// ============================================================================

FrameHandle::FrameHandle()
    : app_napi_(nullptr)
    , tetrahedron_(nullptr)
    , index_(0)
    , rotate_mode_(STOP_ROTATE)
{
}

void FrameHandle::Init(AppNapi* app_napi, Tetrahedron* tetrahedron)
{
    if (app_napi == nullptr || tetrahedron == nullptr) {
        LOGE("FrameHandle::Init: Invalid parameters");
        return;
    }
    app_napi_ = app_napi;
    tetrahedron_ = tetrahedron;
}

/**
 * @brief Set rotation mode
 * @param rotateMode Rotation mode (STOP, AUTO, DAMPING)
 */
void FrameHandle::SetRotate(RotateMode rotateMode)
{
    index_ = 0;
    rotate_mode_ = rotateMode;
}

/**
 * @brief Handle per-frame update
 * @param timestamp Current frame timestamp
 * @param targetTimestamp Target frame timestamp
 */
void FrameHandle::OnFrameHandle(uint64_t timestamp, uint64_t targetTimestamp)
{
    (void)timestamp;      // Suppress unused parameter warning
    (void)targetTimestamp;
    
    index_++;
    
    switch (rotate_mode_) {
        case AUTO_ROTATE:
            ConstantSpeedRotation();
            break;
        case DAMPING_RATATE:
            DampingRotation();
            break;
        case STOP_ROTATE:
        default:
            // No rotation
            break;
    }
}

/**
 * @brief Perform damping rotation animation
 * 
 * Rotation speed decreases exponentially over time:
 * speed = DAMPING_INITIAL_SPEED * OMIGA_MAX * e^(-DAMPING_FACTOR * t / DA_MAX)
 */
void FrameHandle::DampingRotation()
{
    if (tetrahedron_ == nullptr) {
        LOGE("DampingRotation: tetrahedron_ is null");
        return;
    }
    
    if (index_ >= DA_MAX) {
        rotate_mode_ = STOP_ROTATE;
        return;
    }
    
    float angleX = tetrahedron_->GetAngleX();
    float angleY = tetrahedron_->GetAngleY();
    
    // Calculate damping factor using exponential decay
    float factor = static_cast<float>(DAMPING_FACTOR * index_) / static_cast<float>(DA_MAX);
    float deltaAngle = DAMPING_INITIAL_SPEED * OMIGA_MAX * std::pow(EULER_NUMBER, -factor);
    
    // Update angles (only Y-axis rotation for damping)
    angleY += deltaAngle;
    angleX = Normalize(static_cast<int>(angleX));
    angleY = Normalize(static_cast<int>(angleY));
    
    tetrahedron_->Update(angleX, angleY);
}

/**
 * @brief Perform constant speed rotation animation
 * 
 * Rotates at a fixed speed of ROTATION_SPEED degrees per frame
 */
void FrameHandle::ConstantSpeedRotation()
{
    if (tetrahedron_ == nullptr) {
        LOGE("ConstantSpeedRotation: tetrahedron_ is null");
        return;
    }
    
    float angleX = tetrahedron_->GetAngleX();
    float angleY = tetrahedron_->GetAngleY();
    
    // Update angles (only Y-axis rotation)
    angleY += ROTATION_SPEED;
    angleX = Normalize(static_cast<int>(angleX));
    angleY = Normalize(static_cast<int>(angleY));
    
    tetrahedron_->Update(angleX, angleY);
}