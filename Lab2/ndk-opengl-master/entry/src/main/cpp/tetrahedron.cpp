/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

#include <GLES3/gl31.h>
#include <bits/alltypes.h>
#include <cmath>
#include "log.h"
#include "tetrahedron.h"

namespace {
    constexpr float FIFTY_PERCENT = 0.5f;
    constexpr float PI = 3.14159265358979323846f;
    constexpr float DEFAULT_ANGLE_X = 30.0f;
    constexpr float DEFAULT_ANGLE_Y = 45.0f;
    constexpr float SPHERE_RADIUS = 1.0f;
    constexpr int SPHERE_LAT = 40;
    constexpr int SPHERE_LON = 40;
    constexpr int CONE_SEGMENTS = 40;
}

// Blinn-Phong shader with per-vertex colors + specular highlight
static const char* g_vertexShader =
    "attribute vec4 a_pos;\n"
    "attribute vec4 a_color;\n"
    "attribute vec4 a_normal;\n"
    "uniform vec3 u_lightColor;\n"
    "uniform vec3 u_lightDirection;\n"
    "uniform vec3 u_viewPosition;\n"
    "uniform mat4 a_mx;\n"
    "uniform mat4 a_my;\n"
    "uniform mat4 u_scale;\n"
    "varying vec4 v_color;\n"
    "varying vec3 v_normal;\n"
    "varying vec3 v_fragPos;\n"
    "void main() {\n"
    "    vec4 worldPos = a_mx * a_my * u_scale * vec4(a_pos.x, a_pos.y, a_pos.z, 1.0);\n"
    "    gl_Position = worldPos;\n"
    "    v_fragPos = worldPos.xyz;\n"
    "    v_normal = normalize((a_mx * a_my * u_scale * a_normal).xyz);\n"
    "    vec3 lightDir = normalize(u_lightDirection);\n"
    "    float diff = max(dot(lightDir, v_normal), 0.0);\n"
    "    float ambient = 0.2;\n"
    "    vec3 result = (ambient + diff) * u_lightColor * a_color.rgb;\n"
    "    v_color = vec4(result, a_color.a);\n"
    "}\n\0";

static const char* g_fragmentShader =
    "precision mediump float;\n"
    "varying vec4 v_color;\n"
    "varying vec3 v_normal;\n"
    "varying vec3 v_fragPos;\n"
    "uniform vec3 u_viewPosition;\n"
    "uniform vec3 u_lightDirection;\n"
    "uniform vec3 u_lightColor;\n"
    "void main() {\n"
    "    vec3 norm = normalize(v_normal);\n"
    "    vec3 lightDir = normalize(u_lightDirection);\n"
    "    vec3 viewDir = normalize(u_viewPosition - v_fragPos);\n"
    "    vec3 halfway = normalize(lightDir + viewDir);\n"
    "    float spec = pow(max(dot(norm, halfway), 0.0), 32.0) * 0.5;\n"
    "    vec3 specColor = spec * u_lightColor;\n"
    "    gl_FragColor = vec4(v_color.rgb + specColor, v_color.a);\n"
    "}\n\0";

static EGLConfig getConfig(int version, EGLDisplay eglDisplay)
{
    const EGLint attribList[] = {
        EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
        EGL_RED_SIZE, 8,
        EGL_GREEN_SIZE, 8,
        EGL_BLUE_SIZE, 8,
        EGL_ALPHA_SIZE, 8,
        EGL_DEPTH_SIZE, 24,
        EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
        EGL_SAMPLES, 4,
        EGL_NONE
    };

    EGLConfig configs = nullptr;
    EGLint configsNum = 0;

    if (!eglChooseConfig(eglDisplay, attribList, &configs, 1, &configsNum)) {
        LOGE("eglChooseConfig failed: 0x%{public}x", eglGetError());
        return nullptr;
    }
    if (configsNum <= 0) {
        // Fallback without MSAA
        const EGLint fallbackList[] = {
            EGL_SURFACE_TYPE, EGL_WINDOW_BIT,
            EGL_RED_SIZE, 8, EGL_GREEN_SIZE, 8, EGL_BLUE_SIZE, 8, EGL_ALPHA_SIZE, 8,
            EGL_DEPTH_SIZE, 24,
            EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
            EGL_NONE
        };
        if (!eglChooseConfig(eglDisplay, fallbackList, &configs, 1, &configsNum)) {
            LOGE("Fallback eglChooseConfig failed");
            return nullptr;
        }
        LOGI("MSAA not available, using fallback");
    }
    return configs;
}

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
    GLuint shader = glCreateShader(type);
    if (shader == 0) { LOGE("LoadShader shader error"); return 0; }
    glShaderSource(shader, 1, &shaderSrc, nullptr);
    glCompileShader(shader);
    GLint compiled;
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
    GLuint vertex = LoadShader(GL_VERTEX_SHADER, vertexShader);
    if (vertex == 0) return 0;
    GLuint fragment = LoadShader(GL_FRAGMENT_SHADER, fragShader);
    if (fragment == 0) { glDeleteShader(vertex); return 0; }
    GLuint program = glCreateProgram();
    if (program == 0) { glDeleteShader(vertex); glDeleteShader(fragment); return 0; }
    glAttachShader(program, vertex);
    glAttachShader(program, fragment);
    glLinkProgram(program);
    GLint linked;
    glGetProgramiv(program, GL_LINK_STATUS, &linked);
    if (!linked) {
        LOGE("CreateProgram linked error");
        glDeleteShader(vertex); glDeleteShader(fragment); glDeleteProgram(program);
        return 0;
    }
    glDeleteShader(vertex); glDeleteShader(fragment);
    return program;
}

Tetrahedron::Tetrahedron(std::string& id) : id(id)
{
    GenerateGeometry();
}

void Tetrahedron::SetShapeType(ShapeType type)
{
    m_shapeType = type;
    GenerateGeometry();
}

void Tetrahedron::ToggleWireframe()
{
    m_wireframe = !m_wireframe;
}

void Tetrahedron::GenerateGeometry()
{
    m_vertexData.clear();
    m_colorData.clear();
    m_normalData.clear();

    switch (m_shapeType) {
        case ShapeType::TETRAHEDRON: GenerateTetrahedron(); break;
        case ShapeType::SPHERE:      GenerateSphere();      break;
        case ShapeType::CUBE:        GenerateCube();        break;
        case ShapeType::CONE:        GenerateCone();        break;
        default:                     GenerateTetrahedron(); break;
    }

    // Normalize: center by bounding box, then scale to uniform size
    float minX = 0.0f, maxX = 0.0f, minY = 0.0f, maxY = 0.0f, minZ = 0.0f, maxZ = 0.0f;
    bool first = true;
    for (size_t i = 0; i < m_vertexData.size(); i += 3) {
        float x = m_vertexData[i], y = m_vertexData[i + 1], z = m_vertexData[i + 2];
        if (first) {
            minX = maxX = x; minY = maxY = y; minZ = maxZ = z;
            first = false;
        } else {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
        }
    }
    float cx = (minX + maxX) * 0.5f;
    float cy = (minY + maxY) * 0.5f;
    float cz = (minZ + maxZ) * 0.5f;
    float sx = maxX - minX, sy = maxY - minY, sz = maxZ - minZ;
    float maxExtent = sx;
    if (sy > maxExtent) maxExtent = sy;
    if (sz > maxExtent) maxExtent = sz;
    if (maxExtent > 0.001f) {
        float inv = 0.8f / maxExtent;
        for (size_t i = 0; i < m_vertexData.size(); i += 3) {
            m_vertexData[i]     = (m_vertexData[i]     - cx) * inv;
            m_vertexData[i + 1] = (m_vertexData[i + 1] - cy) * inv;
            m_vertexData[i + 2] = (m_vertexData[i + 2] - cz) * inv;
        }
    }

    m_vertexCount = static_cast<int>(m_vertexData.size() / TRIANGLES_POINT);
    LOGI("Generated shape type=%{public}d, vertices=%{public}d", (int)m_shapeType, m_vertexCount);
}

void Tetrahedron::AddTriangle(
    float x1, float y1, float z1,
    float x2, float y2, float z2,
    float x3, float y3, float z3,
    float r, float g, float b)
{
    float ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
    float vx = x3 - x1, vy = y3 - y1, vz = z3 - z1;
    float nx = uy * vz - uz * vy;
    float ny = uz * vx - ux * vz;
    float nz = ux * vy - uy * vx;
    float len = std::sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0.0001f) { nx /= len; ny /= len; nz /= len; }
    else { nx = 0.0f; ny = 1.0f; nz = 0.0f; }

    m_vertexData.push_back(x1); m_vertexData.push_back(y1); m_vertexData.push_back(z1);
    m_colorData.push_back(r);   m_colorData.push_back(g);   m_colorData.push_back(b);
    m_normalData.push_back(nx); m_normalData.push_back(ny); m_normalData.push_back(nz);

    m_vertexData.push_back(x2); m_vertexData.push_back(y2); m_vertexData.push_back(z2);
    m_colorData.push_back(r);   m_colorData.push_back(g);   m_colorData.push_back(b);
    m_normalData.push_back(nx); m_normalData.push_back(ny); m_normalData.push_back(nz);

    m_vertexData.push_back(x3); m_vertexData.push_back(y3); m_vertexData.push_back(z3);
    m_colorData.push_back(r);   m_colorData.push_back(g);   m_colorData.push_back(b);
    m_normalData.push_back(nx); m_normalData.push_back(ny); m_normalData.push_back(nz);
}

// Red-ish tetrahedron
void Tetrahedron::GenerateTetrahedron()
{
    AddTriangle(-0.75f, -0.50f, -0.43f,   0.75f, -0.50f, -0.43f,   0.00f, -0.50f,  0.87f,  0.9f, 0.25f, 0.25f);
    AddTriangle( 0.75f, -0.50f, -0.43f,   0.00f, -0.50f,  0.87f,   0.00f,  1.00f,  0.00f,  0.95f, 0.35f, 0.30f);
    AddTriangle( 0.00f, -0.50f,  0.87f,   0.00f,  1.00f,  0.00f,  -0.75f, -0.50f, -0.43f,  0.85f, 0.20f, 0.20f);
    AddTriangle( 0.00f,  1.00f,  0.00f,  -0.75f, -0.50f, -0.43f,   0.75f, -0.50f, -0.43f,  0.92f, 0.30f, 0.28f);
}

// Blue sphere with smooth vertex normals
void Tetrahedron::GenerateSphere()
{
    float r = SPHERE_RADIUS;
    int latSteps = SPHERE_LAT;
    int lonSteps = SPHERE_LON;

    for (int j = 0; j < latSteps; ++j) {
        float theta1 = PI * (float)j / (float)latSteps;
        float theta2 = PI * (float)(j + 1) / (float)latSteps;
        for (int i = 0; i < lonSteps; ++i) {
            float phi1 = 2.0f * PI * (float)i / (float)lonSteps;
            float phi2 = 2.0f * PI * (float)(i + 1) / (float)lonSteps;

            float x1 = r * std::sin(theta1) * std::cos(phi1);
            float y1 = r * std::cos(theta1);
            float z1 = r * std::sin(theta1) * std::sin(phi1);
            float x2 = r * std::sin(theta2) * std::cos(phi1);
            float y2 = r * std::cos(theta2);
            float z2 = r * std::sin(theta2) * std::sin(phi1);
            float x3 = r * std::sin(theta2) * std::cos(phi2);
            float y3 = r * std::cos(theta2);
            float z3 = r * std::sin(theta2) * std::sin(phi2);
            float x4 = r * std::sin(theta1) * std::cos(phi2);
            float y4 = r * std::cos(theta1);
            float z4 = r * std::sin(theta1) * std::sin(phi2);

            float hue = (float)j / (float)latSteps;
            float rc = 0.25f + 0.15f * hue;
            float gc = 0.35f + 0.25f * hue;
            float bc = 0.6f + 0.4f * hue;

            // Smooth normals = vertex position (for unit sphere)
            float n1x = x1, n1y = y1, n1z = z1;
            float n2x = x2, n2y = y2, n2z = z2;
            float n3x = x3, n3y = y3, n3z = z3;
            float n4x = x4, n4y = y4, n4z = z4;

            // Triangle 1
            m_vertexData.push_back(x1); m_vertexData.push_back(y1); m_vertexData.push_back(z1);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n1x); m_normalData.push_back(n1y); m_normalData.push_back(n1z);
            m_vertexData.push_back(x2); m_vertexData.push_back(y2); m_vertexData.push_back(z2);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n2x); m_normalData.push_back(n2y); m_normalData.push_back(n2z);
            m_vertexData.push_back(x3); m_vertexData.push_back(y3); m_vertexData.push_back(z3);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n3x); m_normalData.push_back(n3y); m_normalData.push_back(n3z);

            // Triangle 2
            m_vertexData.push_back(x1); m_vertexData.push_back(y1); m_vertexData.push_back(z1);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n1x); m_normalData.push_back(n1y); m_normalData.push_back(n1z);
            m_vertexData.push_back(x3); m_vertexData.push_back(y3); m_vertexData.push_back(z3);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n3x); m_normalData.push_back(n3y); m_normalData.push_back(n3z);
            m_vertexData.push_back(x4); m_vertexData.push_back(y4); m_vertexData.push_back(z4);
            m_colorData.push_back(rc); m_colorData.push_back(gc); m_colorData.push_back(bc);
            m_normalData.push_back(n4x); m_normalData.push_back(n4y); m_normalData.push_back(n4z);
        }
    }
}

// Green cube with per-face tinting
void Tetrahedron::GenerateCube()
{
    float s = 0.75f;
    // Each face gets slightly different shade of green
    AddTriangle(-s, -s,  s,   s, -s,  s,   s,  s,  s,  0.25f, 0.75f, 0.30f);
    AddTriangle(-s, -s,  s,   s,  s,  s,  -s,  s,  s,  0.20f, 0.80f, 0.35f);
    AddTriangle( s, -s, -s,  -s, -s, -s,  -s,  s, -s,  0.30f, 0.70f, 0.25f);
    AddTriangle( s, -s, -s,  -s,  s, -s,   s,  s, -s,  0.25f, 0.75f, 0.30f);
    AddTriangle(-s,  s,  s,   s,  s,  s,   s,  s, -s,  0.20f, 0.85f, 0.35f);
    AddTriangle(-s,  s,  s,   s,  s, -s,  -s,  s, -s,  0.28f, 0.78f, 0.32f);
    AddTriangle(-s, -s, -s,   s, -s, -s,   s, -s,  s,  0.22f, 0.82f, 0.38f);
    AddTriangle(-s, -s, -s,   s, -s,  s,  -s, -s,  s,  0.30f, 0.72f, 0.28f);
    AddTriangle( s, -s,  s,   s, -s, -s,   s,  s, -s,  0.18f, 0.88f, 0.42f);
    AddTriangle( s, -s,  s,   s,  s, -s,   s,  s,  s,  0.25f, 0.80f, 0.36f);
    AddTriangle(-s, -s, -s,  -s, -s,  s,  -s,  s,  s,  0.28f, 0.75f, 0.33f);
    AddTriangle(-s, -s, -s,  -s,  s,  s,  -s,  s, -s,  0.22f, 0.78f, 0.30f);
}

// Yellow/orange cone with smooth tip gradients
void Tetrahedron::GenerateCone()
{
    float radius = 0.8f;
    float height = 1.2f;
    int segments = CONE_SEGMENTS;
    float apexX = 0.0f, apexY = height * 0.5f, apexZ = 0.0f;
    float baseY = -height * 0.5f;

    for (int i = 0; i < segments; ++i) {
        float angle1 = 2.0f * PI * (float)i / (float)segments;
        float angle2 = 2.0f * PI * (float)(i + 1) / (float)segments;
        float x1 = radius * std::cos(angle1);
        float z1 = radius * std::sin(angle1);
        float x2 = radius * std::cos(angle2);
        float z2 = radius * std::sin(angle2);

        // Warm yellow-orange gradient
        float hue = (float)i / (float)segments;
        float rc = 0.9f + 0.1f * hue;
        float gc = 0.7f + 0.15f * hue;
        float bc = 0.15f + 0.1f * hue;

        // Side triangles
        AddTriangle(x1, baseY, z1, x2, baseY, z2, apexX, apexY, apexZ, rc, gc, bc);

        float gr = 0.6f + 0.2f * hue;
        float gg = 0.4f + 0.2f * hue;
        float gb = 0.1f + 0.1f * hue;

        // Base cap triangles
        AddTriangle(x1, baseY, z1, 0.0f, baseY, 0.0f, x2, baseY, z2, gr, gg, gb);
    }
}

void Tetrahedron::reSizeWindow(int32_t width, int32_t height)
{
    if ((0 >= width) || (0 >= height)) { LOGE("Tetrahedron::Init: param error."); return; }
    m_width = width;
    m_height = height;
    m_widthPercent = FIFTY_PERCENT * m_height / m_width;
}

int32_t Tetrahedron::Init(void *window, int32_t width, int32_t height)
{
    LOGI("Init window = %{public}p, w = %{public}d, h = %{public}d.", window, width, height);
    mEglWindow = reinterpret_cast<EGLNativeWindowType>(window);
    reSizeWindow(width, height);

    mEGLDisplay = eglGetDisplay(EGL_DEFAULT_DISPLAY);
    if (mEGLDisplay == EGL_NO_DISPLAY) { LOGE("unable to get EGL display."); return -1; }

    EGLint eglMajVers, eglMinVers;
    if (!eglInitialize(mEGLDisplay, &eglMajVers, &eglMinVers)) {
        mEGLDisplay = EGL_NO_DISPLAY;
        LOGE("unable to initialize display");
        return -1;
    }

    int version = 3;
    mEGLConfig = getConfig(version, mEGLDisplay);
    if (mEGLConfig == nullptr) { LOGE("GLContextInit config ERROR"); return -1; }

    EGLint winAttribs[] = {EGL_GL_COLORSPACE_KHR, EGL_GL_COLORSPACE_SRGB_KHR, EGL_NONE};
    if (mEglWindow) {
        mEGLSurface = eglCreateWindowSurface(mEGLDisplay, mEGLConfig, mEglWindow, winAttribs);
        if (mEGLSurface == nullptr) { LOGE("eglCreateContext eglSurface is null"); return -1; }
    }

    int attrib3_list[] = { EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE };
    mEGLContext = eglCreateContext(mEGLDisplay, mEGLConfig, mSharedEGLContext, attrib3_list);
    if (!eglMakeCurrent(mEGLDisplay, mEGLSurface, mEGLSurface, mEGLContext)) {
        LOGE("eglMakeCurrent error = %{public}d", eglGetError());
    }

    mProgramHandle = CreateProgram(g_vertexShader, g_fragmentShader);
    if (!mProgramHandle) { LOGE("Could not create CreateProgram"); return -1; }
    LOGI("Init success.");
    return 0;
}

void Tetrahedron::Update(float angleXOffset, float angleYOffset)
{
    if (m_width <= 0 || m_height <= 0) return;

    glViewport(0, 0, m_width, m_height);
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glUseProgram(mProgramHandle);

    GLint aPos            = glGetAttribLocation(mProgramHandle, "a_pos");
    GLint aColor          = glGetAttribLocation(mProgramHandle, "a_color");
    GLint aNormal         = glGetAttribLocation(mProgramHandle, "a_normal");
    GLint uLightColor     = glGetUniformLocation(mProgramHandle, "u_lightColor");
    GLint uLightDirection = glGetUniformLocation(mProgramHandle, "u_lightDirection");
    GLint uViewPosition   = glGetUniformLocation(mProgramHandle, "u_viewPosition");
    GLint aMx             = glGetUniformLocation(mProgramHandle, "a_mx");
    GLint aMy             = glGetUniformLocation(mProgramHandle, "a_my");
    GLint uScale          = glGetUniformLocation(mProgramHandle, "u_scale");

    angleX = angleXOffset;
    angleY = angleYOffset;

    float radianY = (angleY * PI) / 180.0f;
    float cosY = std::cos(radianY);
    float sinY = std::sin(radianY);
    float myArr[] = { cosY, 0.0f, -sinY, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f, sinY, 0.0f, cosY, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f };
    glUniformMatrix4fv(aMy, 1, GL_FALSE, myArr);

    float radianX = (angleX * PI) / 180.0f;
    float cosX = std::cos(radianX);
    float sinX = std::sin(radianX);
    float mxArr[] = { 1.0f, 0.0f, 0.0f, 0.0f, 0.0f, cosX, -sinX, 0.0f, 0.0f, sinX, cosX, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f };
    glUniformMatrix4fv(aMx, 1, GL_FALSE, mxArr);

    float s = m_scale;
    float scaleArr[] = { s, 0.0f, 0.0f, 0.0f, 0.0f, s, 0.0f, 0.0f, 0.0f, 0.0f, s, 0.0f, 0.0f, 0.0f, 0.0f, 1.0f };
    glUniformMatrix4fv(uScale, 1, GL_FALSE, scaleArr);

    glUniform3f(uLightColor, 1.0f, 1.0f, 1.0f);
    glUniform3f(uLightDirection, 0.4f, -0.6f, 0.7f);
    glUniform3f(uViewPosition, 0.0f, 0.0f, 4.0f);

    if (!m_vertexData.empty()) {
        enableVertexAttrib(aPos, m_vertexData.data(),
            static_cast<int32_t>(m_vertexData.size() * sizeof(float)));
    }
    if (!m_normalData.empty()) {
        enableVertexAttrib(aNormal, m_normalData.data(),
            static_cast<int32_t>(m_normalData.size() * sizeof(float)));
    }
    if (!m_colorData.empty()) {
        enableVertexAttrib(aColor, m_colorData.data(),
            static_cast<int32_t>(m_colorData.size() * sizeof(float)));
    }

    glEnable(GL_DEPTH_TEST);

    glDrawArrays(GL_TRIANGLES, 0, m_vertexCount);

    if (mEGLDisplay != EGL_NO_DISPLAY && mEGLSurface != nullptr) {
        eglSwapBuffers(mEGLDisplay, mEGLSurface);
    }
}

float Tetrahedron::GetAngleX() { return angleX; }
float Tetrahedron::GetAngleY() { return angleY; }

int32_t Tetrahedron::Quit(void)
{
    if (mEGLSurface != nullptr && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroySurface(mEGLDisplay, mEGLSurface)) { LOGW("eglDestroySurface failed: 0x%{public}x", eglGetError()); }
        mEGLSurface = nullptr;
    }
    if (mEGLContext != EGL_NO_CONTEXT && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroyContext(mEGLDisplay, mEGLContext)) { LOGW("eglDestroyContext failed: 0x%{public}x", eglGetError()); }
        mEGLContext = EGL_NO_CONTEXT;
    }
    if (mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglTerminate(mEGLDisplay)) { LOGW("eglTerminate failed: 0x%{public}x", eglGetError()); }
        mEGLDisplay = EGL_NO_DISPLAY;
    }
    LOGI("Tetrahedron resources released successfully.");
    return 0;
}
