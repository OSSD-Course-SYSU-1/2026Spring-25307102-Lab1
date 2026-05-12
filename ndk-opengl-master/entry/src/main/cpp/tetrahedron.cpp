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
    constexpr float LIGHT_DIRECTION_X = 2.0f;
    constexpr float LIGHT_DIRECTION_Y = 2.0f;
    constexpr float LIGHT_DIRECTION_Z = 3.0f;
}

static const char* g_vertexShader =
    "attribute vec4 a_pos;\n"
    "attribute vec4 a_color;\n"
    "attribute vec4 a_normal;\n"
    "uniform vec3 u_lightColor;\n"
    "uniform vec3 u_lightDirection;\n"
    "uniform mat4 a_mx;\n"
    "uniform mat4 a_my;\n"
    "uniform mat4 u_scale;\n"
    "varying vec4 v_color;\n"
    "void main() {\n"
    "    gl_Position = a_mx * a_my * u_scale * vec4(a_pos.x, a_pos.y, a_pos.z, 1.0);\n"
    "    vec3 normal = normalize((a_mx * a_my * u_scale * a_normal).xyz);\n"
    "    float dot = max(dot(u_lightDirection, normal), 0.0);\n"
    "    vec3 reflectedLight = u_lightColor * a_color.rgb * dot;\n"
    "    v_color = vec4(reflectedLight, a_color.a);\n"
    "}\n\0";

static const char* g_fragmentShader =
    "precision mediump float;\n"
    "varying vec4 v_color;\n"
    "void main() {\n"
    "    gl_FragColor = v_color;\n"
    "}\n\0";

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

Tetrahedron::Tetrahedron(std::string& id) : id(id)
{
    GenerateGeometry();
}

void Tetrahedron::SetShapeType(ShapeType type)
{
    m_shapeType = type;
    GenerateGeometry();
}

void Tetrahedron::SetShapeParams(const ShapeParams& params)
{
    m_shapeParams = params;
    if (m_shapeType >= ShapeType::PARAMETRIC_ELLIPSOID) {
        GenerateGeometry();
    }
}

void Tetrahedron::GenerateGeometry()
{
    m_vertexData.clear();
    m_colorData.clear();
    m_normalData.clear();

    switch (m_shapeType) {
        case ShapeType::TETRAHEDRON:
            GenerateTetrahedron();
            break;
        case ShapeType::SPHERE:
            GenerateSphere();
            break;
        case ShapeType::CUBE:
            GenerateCube();
            break;
        case ShapeType::CONE:
            GenerateCone();
            break;
        case ShapeType::PARAMETRIC_ELLIPSOID:
            GenerateEllipsoid();
            break;
        case ShapeType::PARAMETRIC_HYPERBOLOID:
            GenerateHyperboloid();
            break;
        case ShapeType::PARAMETRIC_PARABOLOID:
            GenerateParaboloid();
            break;
        case ShapeType::PARAMETRIC_ELLIPTIC_CONE:
            GenerateEllipticCone();
            break;
        default:
            GenerateTetrahedron();
            break;
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
    if (len > 0.0001f) {
        nx /= len; ny /= len; nz /= len;
    } else {
        nx = 0.0f; ny = 1.0f; nz = 0.0f;
    }

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

void Tetrahedron::GenerateTetrahedron()
{
    AddTriangle(-0.75f, -0.50f, -0.43f,   0.75f, -0.50f, -0.43f,   0.00f, -0.50f,  0.87f,  1.0f, 0.3f, 0.3f);
    AddTriangle( 0.75f, -0.50f, -0.43f,   0.00f, -0.50f,  0.87f,   0.00f,  1.00f,  0.00f,  1.0f, 0.3f, 0.3f);
    AddTriangle( 0.00f, -0.50f,  0.87f,   0.00f,  1.00f,  0.00f,  -0.75f, -0.50f, -0.43f,  1.0f, 0.3f, 0.3f);
    AddTriangle( 0.00f,  1.00f,  0.00f,  -0.75f, -0.50f, -0.43f,   0.75f, -0.50f, -0.43f,  1.0f, 0.3f, 0.3f);
}

void Tetrahedron::GenerateSphere()
{
    float radius = m_shapeParams.paramA;
    int latSteps = m_shapeParams.resolutionV;
    int lonSteps = m_shapeParams.resolutionU;

    for (int j = 0; j < latSteps; ++j) {
        float theta1 = PI * static_cast<float>(j) / static_cast<float>(latSteps);
        float theta2 = PI * static_cast<float>(j + 1) / static_cast<float>(latSteps);

        for (int i = 0; i < lonSteps; ++i) {
            float phi1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(lonSteps);
            float phi2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(lonSteps);

            float x1 = radius * std::sin(theta1) * std::cos(phi1);
            float y1 = radius * std::cos(theta1);
            float z1 = radius * std::sin(theta1) * std::sin(phi1);

            float x2 = radius * std::sin(theta2) * std::cos(phi1);
            float y2 = radius * std::cos(theta2);
            float z2 = radius * std::sin(theta2) * std::sin(phi1);

            float x3 = radius * std::sin(theta2) * std::cos(phi2);
            float y3 = radius * std::cos(theta2);
            float z3 = radius * std::sin(theta2) * std::sin(phi2);

            float x4 = radius * std::sin(theta1) * std::cos(phi2);
            float y4 = radius * std::cos(theta1);
            float z4 = radius * std::sin(theta1) * std::sin(phi2);

            float hue = static_cast<float>(j) / static_cast<float>(latSteps);
            float r = 0.3f + 0.7f * hue;
            float g = 0.3f + 0.4f * (1.0f - hue);
            float b = 0.5f + 0.5f * hue;

            AddTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, b);
            AddTriangle(x1, y1, z1, x3, y3, z3, x4, y4, z4, r, g, b);
        }
    }
}

void Tetrahedron::GenerateCube()
{
    float s = m_shapeParams.paramA * 0.5f;

    AddTriangle(-s, -s,  s,   s, -s,  s,   s,  s,  s,  1.0f, 0.2f, 0.2f);
    AddTriangle(-s, -s,  s,   s,  s,  s,  -s,  s,  s,  1.0f, 0.2f, 0.2f);
    AddTriangle( s, -s, -s,  -s, -s, -s,  -s,  s, -s,  0.2f, 1.0f, 0.2f);
    AddTriangle( s, -s, -s,  -s,  s, -s,   s,  s, -s,  0.2f, 1.0f, 0.2f);
    AddTriangle(-s,  s,  s,   s,  s,  s,   s,  s, -s,  0.2f, 0.2f, 1.0f);
    AddTriangle(-s,  s,  s,   s,  s, -s,  -s,  s, -s,  0.2f, 0.2f, 1.0f);
    AddTriangle(-s, -s, -s,   s, -s, -s,   s, -s,  s,  1.0f, 1.0f, 0.2f);
    AddTriangle(-s, -s, -s,   s, -s,  s,  -s, -s,  s,  1.0f, 1.0f, 0.2f);
    AddTriangle( s, -s,  s,   s, -s, -s,   s,  s, -s,  1.0f, 0.5f, 0.0f);
    AddTriangle( s, -s,  s,   s,  s, -s,   s,  s,  s,  1.0f, 0.5f, 0.0f);
    AddTriangle(-s, -s, -s,  -s, -s,  s,  -s,  s,  s,  0.5f, 0.0f, 1.0f);
    AddTriangle(-s, -s, -s,  -s,  s,  s,  -s,  s, -s,  0.5f, 0.0f, 1.0f);
}

void Tetrahedron::GenerateCone()
{
    float radius = m_shapeParams.paramA * 0.6f;
    float height = m_shapeParams.paramC * 1.2f;
    int segments = m_shapeParams.resolutionU;

    float apexX = 0.0f, apexY = height * 0.5f, apexZ = 0.0f;
    float baseY = -height * 0.5f;

    for (int i = 0; i < segments; ++i) {
        float angle1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(segments);
        float angle2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(segments);

        float x1 = radius * std::cos(angle1);
        float z1 = radius * std::sin(angle1);
        float x2 = radius * std::cos(angle2);
        float z2 = radius * std::sin(angle2);

        float hue = static_cast<float>(i) / static_cast<float>(segments);

        AddTriangle(x1, baseY, z1, x2, baseY, z2, apexX, apexY, apexZ,
                    0.3f + 0.7f * hue, 0.8f, 0.3f + 0.5f * (1.0f - hue));
        AddTriangle(x1, baseY, z1, 0.0f, baseY, 0.0f, x2, baseY, z2,
                    0.3f + 0.7f * hue, 0.3f + 0.5f * (1.0f - hue), 0.8f);
    }
}

void Tetrahedron::GenerateEllipsoid()
{
    float a = m_shapeParams.paramA;
    float b = m_shapeParams.paramB;
    float c = m_shapeParams.paramC;
    int uSteps = m_shapeParams.resolutionU;
    int vSteps = m_shapeParams.resolutionV;

    for (int j = 0; j < vSteps; ++j) {
        float v1 = PI * static_cast<float>(j) / static_cast<float>(vSteps);
        float v2 = PI * static_cast<float>(j + 1) / static_cast<float>(vSteps);

        for (int i = 0; i < uSteps; ++i) {
            float u1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(uSteps);
            float u2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(uSteps);

            float x1 = a * std::sin(v1) * std::cos(u1);
            float y1 = b * std::cos(v1);
            float z1 = c * std::sin(v1) * std::sin(u1);

            float x2 = a * std::sin(v2) * std::cos(u1);
            float y2 = b * std::cos(v2);
            float z2 = c * std::sin(v2) * std::sin(u1);

            float x3 = a * std::sin(v2) * std::cos(u2);
            float y3 = b * std::cos(v2);
            float z3 = c * std::sin(v2) * std::sin(u2);

            float x4 = a * std::sin(v1) * std::cos(u2);
            float y4 = b * std::cos(v1);
            float z4 = c * std::sin(v1) * std::sin(u2);

            float hue = static_cast<float>(j) / static_cast<float>(vSteps);
            float r = 0.3f + 0.5f * hue;
            float g = 0.4f + 0.4f * (1.0f - hue);
            float bl = 0.6f + 0.4f * hue;

            AddTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, bl);
            AddTriangle(x1, y1, z1, x3, y3, z3, x4, y4, z4, r, g, bl);
        }
    }
}

void Tetrahedron::GenerateHyperboloid()
{
    float a = m_shapeParams.paramA * 0.8f;
    float b = m_shapeParams.paramB * 0.8f;
    float cl = m_shapeParams.paramC * 0.8f;
    int uSteps = m_shapeParams.resolutionU;
    int vSteps = m_shapeParams.resolutionV;
    float uMin = -1.2f, uMax = 1.2f;

    for (int j = 0; j < vSteps; ++j) {
        float u1 = uMin + (uMax - uMin) * static_cast<float>(j) / static_cast<float>(vSteps);
        float u2 = uMin + (uMax - uMin) * static_cast<float>(j + 1) / static_cast<float>(vSteps);

        for (int i = 0; i < uSteps; ++i) {
            float v1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(uSteps);
            float v2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(uSteps);

            float ch1 = std::cosh(u1), sh1 = std::sinh(u1);
            float ch2 = std::cosh(u2), sh2 = std::sinh(u2);

            float x1 = a * ch1 * std::cos(v1);
            float y1 = b * ch1 * std::sin(v1);
            float z1 = cl * sh1;

            float x2 = a * ch2 * std::cos(v1);
            float y2 = b * ch2 * std::sin(v1);
            float z2 = cl * sh2;

            float x3 = a * ch2 * std::cos(v2);
            float y3 = b * ch2 * std::sin(v2);
            float z3 = cl * sh2;

            float x4 = a * ch1 * std::cos(v2);
            float y4 = b * ch1 * std::sin(v2);
            float z4 = cl * sh1;

            float hue = static_cast<float>(j) / static_cast<float>(vSteps);
            float r = 0.2f + 0.6f * hue;
            float g = 0.6f;
            float bl2 = 0.3f + 0.5f * (1.0f - hue);

            AddTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, bl2);
            AddTriangle(x1, y1, z1, x3, y3, z3, x4, y4, z4, r, g, bl2);
        }
    }
}

void Tetrahedron::GenerateParaboloid()
{
    float a = m_shapeParams.paramA * 0.8f;
    float b = m_shapeParams.paramB * 0.8f;
    float scaleZ = m_shapeParams.paramC * 0.6f;
    int uSteps = m_shapeParams.resolutionU;
    int vSteps = m_shapeParams.resolutionV;
    float uMax = 1.5f;

    for (int j = 0; j < vSteps; ++j) {
        float u1 = uMax * static_cast<float>(j) / static_cast<float>(vSteps);
        float u2 = uMax * static_cast<float>(j + 1) / static_cast<float>(vSteps);

        for (int i = 0; i < uSteps; ++i) {
            float v1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(uSteps);
            float v2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(uSteps);

            float x1 = a * u1 * std::cos(v1);
            float y1 = b * u1 * std::sin(v1);
            float z1 = scaleZ * u1 * u1;

            float x2 = a * u2 * std::cos(v1);
            float y2 = b * u2 * std::sin(v1);
            float z2 = scaleZ * u2 * u2;

            float x3 = a * u2 * std::cos(v2);
            float y3 = b * u2 * std::sin(v2);
            float z3 = scaleZ * u2 * u2;

            float x4 = a * u1 * std::cos(v2);
            float y4 = b * u1 * std::sin(v2);
            float z4 = scaleZ * u1 * u1;

            float hue = static_cast<float>(j) / static_cast<float>(vSteps);
            float r = 0.3f + 0.5f * hue;
            float g = 0.2f + 0.6f * hue;
            float bl2 = 0.7f;

            AddTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, bl2);
            AddTriangle(x1, y1, z1, x3, y3, z3, x4, y4, z4, r, g, bl2);
        }
    }
}

void Tetrahedron::GenerateEllipticCone()
{
    float a = m_shapeParams.paramA * 0.7f;
    float b = m_shapeParams.paramB * 0.7f;
    float cl = m_shapeParams.paramC * 0.7f;
    int uSteps = m_shapeParams.resolutionU;
    int vSteps = m_shapeParams.resolutionV;
    float uMax = 1.8f;

    for (int j = 0; j < vSteps; ++j) {
        float u1 = uMax * static_cast<float>(j) / static_cast<float>(vSteps);
        float u2 = uMax * static_cast<float>(j + 1) / static_cast<float>(vSteps);

        for (int i = 0; i < uSteps; ++i) {
            float v1 = 2.0f * PI * static_cast<float>(i) / static_cast<float>(uSteps);
            float v2 = 2.0f * PI * static_cast<float>(i + 1) / static_cast<float>(uSteps);

            float x1 = a * u1 * std::cos(v1);
            float y1 = b * u1 * std::sin(v1);
            float z1 = cl * u1 - cl * uMax * 0.5f;

            float x2 = a * u2 * std::cos(v1);
            float y2 = b * u2 * std::sin(v1);
            float z2 = cl * u2 - cl * uMax * 0.5f;

            float x3 = a * u2 * std::cos(v2);
            float y3 = b * u2 * std::sin(v2);
            float z3 = cl * u2 - cl * uMax * 0.5f;

            float x4 = a * u1 * std::cos(v2);
            float y4 = b * u1 * std::sin(v2);
            float z4 = cl * u1 - cl * uMax * 0.5f;

            float hue = static_cast<float>(j) / static_cast<float>(vSteps);
            float r = 0.5f + 0.5f * hue;
            float g = 0.5f;
            float bl2 = 0.3f + 0.5f * (1.0f - hue);

            AddTriangle(x1, y1, z1, x2, y2, z2, x3, y3, z3, r, g, bl2);
            AddTriangle(x1, y1, z1, x3, y3, z3, x4, y4, z4, r, g, bl2);
        }
    }
}

void Tetrahedron::reSizeWindow(int32_t width, int32_t height)
{
    if ((0 >= width) || (0 >= height)) {
        LOGE("Tetrahedron::Init: param error.");
        return;
    }
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

void Tetrahedron::Update(float angleXOffset, float angleYOffset)
{
    if (m_width <= 0 || m_height <= 0) {
        return;
    }

    glViewport(0, 0, m_width, m_height);
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glUseProgram(mProgramHandle);

    GLint aPos           = glGetAttribLocation(mProgramHandle, "a_pos");
    GLint aColor         = glGetAttribLocation(mProgramHandle, "a_color");
    GLint aNormal        = glGetAttribLocation(mProgramHandle, "a_normal");
    GLint uLightColor    = glGetUniformLocation(mProgramHandle, "u_lightColor");
    GLint uLightDirection = glGetUniformLocation(mProgramHandle, "u_lightDirection");
    GLint aMx            = glGetUniformLocation(mProgramHandle, "a_mx");
    GLint aMy            = glGetUniformLocation(mProgramHandle, "a_my");
    GLint uScale         = glGetUniformLocation(mProgramHandle, "u_scale");

    angleX = angleXOffset;
    angleY = angleYOffset;

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

    float s = m_scale;
    float scaleArr[] = {
        s,    0.0f, 0.0f, 0.0f,
        0.0f, s,    0.0f, 0.0f,
        0.0f, 0.0f, s,    0.0f,
        0.0f, 0.0f, 0.0f, 1.0f
    };
    glUniformMatrix4fv(uScale, 1, GL_FALSE, scaleArr);

    glUniform3f(uLightColor, 1.0f, 1.0f, 1.0f);

    constexpr float sqrt15 = 3.872983346207417f;
    float lightX = LIGHT_DIRECTION_X / sqrt15;
    float lightY = LIGHT_DIRECTION_Y / sqrt15;
    float lightZ = LIGHT_DIRECTION_Z / sqrt15;
    glUniform3f(uLightDirection, lightX, -lightY, lightZ);

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

float Tetrahedron::GetAngleX()
{
    return angleX;
}

float Tetrahedron::GetAngleY()
{
    return angleY;
}

int32_t Tetrahedron::Quit(void)
{
    if (mEGLSurface != nullptr && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroySurface(mEGLDisplay, mEGLSurface)) {
            LOGW("eglDestroySurface failed: 0x%{public}x", eglGetError());
        }
        mEGLSurface = nullptr;
    }

    if (mEGLContext != EGL_NO_CONTEXT && mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglDestroyContext(mEGLDisplay, mEGLContext)) {
            LOGW("eglDestroyContext failed: 0x%{public}x", eglGetError());
        }
        mEGLContext = EGL_NO_CONTEXT;
    }

    if (mEGLDisplay != EGL_NO_DISPLAY) {
        if (!eglTerminate(mEGLDisplay)) {
            LOGW("eglTerminate failed: 0x%{public}x", eglGetError());
        }
        mEGLDisplay = EGL_NO_DISPLAY;
    }

    LOGI("Tetrahedron resources released successfully.");
    return 0;
}
