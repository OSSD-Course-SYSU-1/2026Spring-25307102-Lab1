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
 * @file tetrahedron.cpp
 * @brief OpenGL ES 3D Tetrahedron Rendering Implementation
 * 
 * This file implements the core OpenGL ES rendering logic for a 3D tetrahedron
 * with lighting effects. It handles EGL context creation, shader compilation,
 * and frame rendering.
 */

#include <GLES3/gl31.h>
#include <bits/alltypes.h>
#include <cmath>
#include "log.h"
#include "tetrahedron.h"

// ============================================================================
// Constants
// ============================================================================
namespace {
    constexpr float FIFTY_PERCENT = 0.5f;
    constexpr float PI = 3.14159265358979323846f;
    constexpr float DEFAULT_ANGLE_X = 30.0f;
    constexpr float DEFAULT_ANGLE_Y = 45.0f;
    constexpr float LIGHT_DIRECTION_X = 2.0f;
    constexpr float LIGHT_DIRECTION_Y = 2.0f;
    constexpr float LIGHT_DIRECTION_Z = 3.0f;
}

// ============================================================================
// Shader Source Code
// ============================================================================

/**
 * Vertex Shader:
 * - Transforms vertex positions using rotation matrices
 * - Calculates diffuse lighting based on light direction and surface normal
 * - Passes computed color to fragment shader
 */
static const char* g_vertexShader =
    "attribute vec4 a_pos;\n"
    "attribute vec4 a_color;\n"
    "attribute vec4 a_normal;\n"
    "uniform vec3 u_lightColor;\n"
    "uniform vec3 u_lightDirection;\n"
    "uniform mat4 a_mx;\n"
    "uniform mat4 a_my;\n"
    "varying vec4 v_color;\n"
    "void main() {\n"
    "    gl_Position = a_mx * a_my * vec4(a_pos.x, a_pos.y, a_pos.z, 1.0);\n"
    "    vec3 normal = normalize((a_mx * a_my * a_normal).xyz);\n"
    "    float dot = max(dot(u_lightDirection, normal), 0.0);\n"
    "    vec3 reflectedLight = u_lightColor * a_color.rgb * dot;\n"
    "    v_color = vec4(reflectedLight, a_color.a);\n"
    "}\n\0";

/**
 * Fragment Shader:
 * - Receives interpolated color from vertex shader
 * - Outputs final pixel color
 */
static const char* g_fragmentShader =
    "precision mediump float;\n"
    "varying vec4 v_color;\n"
    "void main() {\n"
    "    gl_FragColor = v_color;\n"
    "}\n\0";

// ============================================================================
// Tetrahedron Geometry Data
// ============================================================================

/**
 * Vertex positions for the tetrahedron (4 triangular faces)
 * Each face is defined by 3 vertices (x, y, z)
 * Total: 12 vertices (4 faces × 3 vertices)
 */
static const float g_vertexData[] = {
    // Face 1 (bottom)
    -0.75f, -0.50f, -0.43f,   // vertex 1
     0.75f, -0.50f, -0.43f,   // vertex 2
     0.00f, -0.50f,  0.87f,   // vertex 3
    // Face 2 (side 1)
     0.75f, -0.50f, -0.43f,   // vertex 2
     0.00f, -0.50f,  0.87f,   // vertex 3
     0.00f,  1.00f,  0.00f,   // apex
    // Face 3 (side 2)
     0.00f, -0.50f,  0.87f,   // vertex 3
     0.00f,  1.00f,  0.00f,   // apex
    -0.75f, -0.50f, -0.43f,   // vertex 1
    // Face 4 (side 3)
     0.00f,  1.00f,  0.00f,   // apex
    -0.75f, -0.50f, -0.43f,   // vertex 1
     0.75f, -0.50f, -0.43f,   // vertex 2
};

/**
 * Vertex colors (RGBA) - Red color for all faces
 * Each vertex has 3 color components (R, G, B)
 */
static const float g_colorData[] = {
    // Face 1 - Red
    1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,
    // Face 2 - Red
    1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,
    // Face 3 - Red
    1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,
    // Face 4 - Red
    1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,  1.0f, 0.0f, 0.0f,
};

/**
 * Vertex normals for lighting calculations
 * Each normal vector is normalized (length = 1)
 */
static const float g_normalData[] = {
    // Face 1 normal (pointing down)
     0.00f, -1.00f,  0.00f,   0.00f, -1.00f,  0.00f,   0.00f, -1.00f,  0.00f,
    // Face 2 normal
    -0.83f, -0.28f, -0.48f,  -0.83f, -0.28f, -0.48f,  -0.83f, -0.28f, -0.48f,
    // Face 3 normal
    -0.83f,  0.28f,  0.48f,  -0.83f,  0.28f,  0.48f,  -0.83f,  0.28f,  0.48f,
    // Face 4 normal
     0.00f, -0.28f,  0.96f,   0.00f, -0.28f,  0.96f,   0.00f, -0.28f,  0.96f,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * @brief Select an appropriate EGL configuration
 * @param version OpenGL ES version (not used currently, reserved for future)
 * @param eglDisplay EGL display connection
 * @return EGLConfig on success, nullptr on failure
 */
static EGLConfig getConfig(int version, EGLDisplay eglDisplay)
{
    const EGLint attribList[] = {
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_RED_SIZE, 8,
        EGL_GREEN_SIZE, 8,
        EGL_BLUE_SIZE, 8,
        EGL_ALPHA_SIZE, 8,
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
        EGL_NONE
    };
    
    EGLConfig configs = nullptr;
    EGLint configsNum = 0;

    if (!eglChooseConfig(eglDisplay, attribList, &configs, 1, &configsNum)) {
        LOGE("eglChooseConfig failed: 0x%{public}x", eglGetError());
        return nullptr;
    }
    
    if (configsNum <= 0) {
        LOGE("No suitable EGL config found");
        return nullptr;
    }

    return configs;
}

/**
 * @brief Enable vertex attribute with buffer data
 * @param index Attribute index in shader
 * @param data Vertex data array
 * @param len Size of data in bytes
 */
static void enableVertexAttrib(GLuint index, const float* data, int32_t len)
{
    if (data == nullptr || len <= 0) {
        LOGE("Invalid vertex attribute data");
        return;
    }
    
    GLuint buffer;
    glGenBuffers(1, &buffer);
    glBindBuffer(GL_ARRAY_BUFFER, buffer);
    glBufferData(GL_ARRAY_BUFFER, len, data, GL_STATIC_DRAW);
    glVertexAttribPointer(index, TRIANGLES_POINT, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(index);
}

GLuint Tetrahedron::LoadShader(GLenum type, const char *shaderSrc)
{
    GLuint shader;
    GLint compiled;

    shader = glCreateShader(type);
    if (shader == 0) {
        LOGE("LoadShader shader error");
        return 0;
    }

    glShaderSource(shader, 1, &shaderSrc, nullptr);
    glCompileShader(shader);

    glGetShaderiv(shader, GL_COMPILE_STATUS, &compiled);

    if (!compiled) {
        GLint infoLen = 0;
        glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLen);

        if (infoLen > 1) {
            std::string infoLog(infoLen, '\0');
            glGetShaderInfoLog(shader, infoLen, nullptr, (GLchar *)&infoLog);
            LOGE("Error compiling shader:%{public}s\n", infoLog.c_str());
        }

        glDeleteShader(shader);
        return 0;
    }

    return shader;
}

GLuint Tetrahedron::CreateProgram(const char *vertexShader, const char *fragShader)
{
    GLuint vertex;
    GLuint fragment;
    GLuint program;
    GLint linked;

    vertex = LoadShader(GL_VERTEX_SHADER, vertexShader);
    if (vertex == 0) {
        LOGE("LoadShader: vertexShader error");
        return 0;
    }

    fragment = LoadShader(GL_FRAGMENT_SHADER, fragShader);
    if (fragment == 0) {
        LOGE("LoadShader: fragShader error");
        glDeleteShader(vertex);
        return 0;
    }

    program = glCreateProgram();
    if (program == 0) {
        LOGE("CreateProgram program error");
        glDeleteShader(vertex);
        glDeleteShader(fragment);
        return 0;
    }

    glAttachShader(program, vertex);
    glAttachShader(program, fragment);
    glLinkProgram(program);
    glGetProgramiv(program, GL_LINK_STATUS, &linked);

    if (!linked) {
        LOGE("CreateProgram linked error");
        GLint infoLen = 0;
        glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLen);
        if (infoLen > 1) {
            std::string infoLog(infoLen, '\0');
            glGetProgramInfoLog(program, infoLen, nullptr, (GLchar *)&infoLog);
            LOGE("Error linking program:%{public}s\n", infoLog.c_str());
        }
        glDeleteShader(vertex);
        glDeleteShader(fragment);
        glDeleteProgram(program);
        return 0;
    }
    glDeleteShader(vertex);
    glDeleteShader(fragment);

    return program;
}

void Tetrahedron::reSizeWindow(int32_t width,  int32_t height)
{
    if ((0 >= width) || (0 >= height)) {
        LOGE("Tetrahedron::Init: param error.");
        return;
    }
    m_width = width;
    m_height = height;
    m_widthPercent = FIFTY_PERCENT * m_height / m_width;
}

int32_t Tetrahedron::Init(void *window, int32_t width,  int32_t height)
{
    LOGI("Init window = %{public}p, w = %{public}d, h = %{public}d.", window, width, height);
    mEglWindow = reinterpret_cast<EGLNativeWindowType>(window);

    mEGLDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (mEGLDisplay == EGL_NO_DISPLAY) {
        LOGE("unable to get EGL display.");
        return -1;
    }

    EGLint eglMajVers;
    EGLint eglMinVers;
    if (!eglInitialize(mEGLDisplay, &eglMajVers, &eglMinVers)) {
        mEGLDisplay = EGL_NO_DISPLAY;
        LOGE("unable to initialize display");
        return -1;
    }

    int version = 3;
    mEGLConfig = getConfig(version, mEGLDisplay);
    if (mEGLConfig == nullptr) {
        LOGE("GLContextInit config ERROR");
        return -1;
    }

    EGLint winAttribs[] = {EGL_GL_COLORSPACE_KHR, EGL_GL_COLORSPACE_SRGB_KHR, EGL_NONE};
    if (mEglWindow) {
        mEGLSurface = eglCreateWindowSurface(mEGLDisplay, mEGLConfig, mEglWindow, winAttribs);
        if (mEGLSurface == nullptr) {
            LOGE("eglCreateContext eglSurface is null");
            return -1;
        }
    }
    
    /* Create EGLContext from */
    int attrib3_list[] = {
        EGL_CONTEXT_CLIENT_VERSION, 2,
        EGL_NONE
    };
    
    mEGLContext = eglCreateContext(mEGLDisplay, mEGLConfig, mSharedEGLContext, attrib3_list);
    if (!eglMakeCurrent(mEGLDisplay, mEGLSurface, mEGLSurface, mEGLContext)) {
        LOGE("eglMakeCurrent error = %{public}d", eglGetError());
    }
    
    mProgramHandle = CreateProgram(g_vertexShader, g_fragmentShader);
    if (!mProgramHandle) {
        LOGE("Could not create CreateProgram");
        return -1;
    }

    LOGI("Init success.");

    return 0;
}

/**
 * @brief Update and render the tetrahedron with new rotation angles
 * @param angleXOffset X-axis rotation angle in degrees
 * @param angleYOffset Y-axis rotation angle in degrees
 */
void Tetrahedron::Update(float angleXOffset, float angleYOffset)
{
    // Validate dimensions
    if (m_width <= 0 || m_height <= 0) {
        LOGE("Tetrahedron::Update: Invalid dimensions w=%{public}d, h=%{public}d", m_width, m_height);
        return;
    }
    
    // Set viewport and clear buffers
    glViewport(0, 0, m_width, m_height);
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glUseProgram(mProgramHandle);

    // Get shader attribute and uniform locations
    GLint aPos = glGetAttribLocation(mProgramHandle, "a_pos");
    GLint aColor = glGetAttribLocation(mProgramHandle, "a_color");
    GLint aNormal = glGetAttribLocation(mProgramHandle, "a_normal");
    GLint uLightColor = glGetUniformLocation(mProgramHandle, "u_lightColor");
    GLint uLightDirection = glGetUniformLocation(mProgramHandle, "u_lightDirection");
    GLint aMx = glGetUniformLocation(mProgramHandle, "a_mx");
    GLint aMy = glGetUniformLocation(mProgramHandle, "a_my");

    // Store current angles
    angleX = angleXOffset;
    angleY = angleYOffset;

    // Calculate Y-axis rotation matrix
    float radianY = (angleY * PI) / 180.0f;
    float cosY = std::cos(radianY);
    float sinY = std::sin(radianY);
    float myArr[] = {
        cosY,  0.0f, -sinY, 0.0f,
        0.0f,  1.0f,  0.0f, 0.0f,
        sinY,  0.0f,  cosY, 0.0f,
        0.0f,  0.0f,  0.0f, 1.0f
    };
    glUniformMatrix4fv(aMy, 1, GL_FALSE, myArr);

    // Calculate X-axis rotation matrix
    float radianX = (angleX * PI) / 180.0f;
    float cosX = std::cos(radianX);
    float sinX = std::sin(radianX);
    float mxArr[] = {
        1.0f,  0.0f,  0.0f, 0.0f,
        0.0f,  cosX, -sinX, 0.0f,
        0.0f,  sinX,  cosX, 0.0f,
        0.0f,  0.0f,  0.0f, 1.0f
    };
    glUniformMatrix4fv(aMx, 1, GL_FALSE, mxArr);

    // Set light properties (white light)
    glUniform3f(uLightColor, 1.0f, 1.0f, 1.0f);

    // Set light direction (normalized vector)
    // Direction: (2, -2, 3) normalized to unit length
    constexpr float sqrt15 = 3.872983346207417f;  // sqrt(15)
    float lightX = LIGHT_DIRECTION_X / sqrt15;
    float lightY = LIGHT_DIRECTION_Y / sqrt15;
    float lightZ = LIGHT_DIRECTION_Z / sqrt15;
    glUniform3f(uLightDirection, lightX, -lightY, lightZ);

    // Bind vertex attributes
    enableVertexAttrib(aPos, g_vertexData, sizeof(g_vertexData));
    enableVertexAttrib(aNormal, g_normalData, sizeof(g_normalData));
    enableVertexAttrib(aColor, g_colorData, sizeof(g_colorData));

    // Enable depth testing for proper 3D rendering
    glEnable(GL_DEPTH_TEST);

    // Draw the tetrahedron
    glDrawArrays(GL_TRIANGLES, 0, TETRAHEDRON_POINT);
    
    // Swap buffers to display the rendered frame
    if (mEGLDisplay != EGL_NO_DISPLAY && mEGLSurface != nullptr) {
        eglSwapBuffers(mEGLDisplay, mEGLSurface);
    }
}

float Tetrahedron::GetAngleX()
{
    return angleX;
}

float Tetrahedron::GetAngleY()
{
    return angleY;
}

/**
 * @brief Clean up EGL resources
 * @return 0 on success, -1 on failure
 */
int32_t Tetrahedron::Quit(void)
{
    // Destroy EGL surface
    if (mEGLSurface != nullptr && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroySurface(mEGLDisplay, mEGLSurface)) {
            LOGW("eglDestroySurface failed: 0x%{public}x", eglGetError());
        }
        mEGLSurface = nullptr;
    }

    // Destroy EGL context
    if (mEGLContext != EGL_NO_CONTEXT && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroyContext(mEGLDisplay, mEGLContext)) {
            LOGW("eglDestroyContext failed: 0x%{public}x", eglGetError());
        }
        mEGLContext = EGL_NO_CONTEXT;
    }

    // Terminate EGL display connection
    if (mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglTerminate(mEGLDisplay)) {
            LOGW("eglTerminate failed: 0x%{public}x", eglGetError());
        }
        mEGLDisplay = EGL_NO_DISPLAY;
    }

    LOGI("Tetrahedron resources released successfully.");
    return 0;
}
