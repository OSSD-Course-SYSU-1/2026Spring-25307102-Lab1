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

#ifndef TETRAHEDRON_H
#define TETRAHEDRON_H

#include <GLES3/gl3.h>
#include <EGL/egl.h>
#include <EGL/eglext.h>

#include <string>
#include <stdint.h>
#include <vector>

#define TRIANGLES_POINT     3
#define TETRAHEDRON_POINT   12

enum class ShapeType {
    TETRAHEDRON = 0,
    SPHERE,
    CUBE,
    CONE,
    SHAPE_COUNT
};

class Tetrahedron {
public:
    explicit Tetrahedron(std::string& id);

    int32_t Init(void* windowHandle, int windowWidth, int windowHeight);
    void reSizeWindow(int windowWidth, int windowHeight);
    void Update(float angleXOffset, float angleYOffset);
    float GetAngleX(void);
    float GetAngleY(void);
    int32_t Quit(void);

    void SetShapeType(ShapeType type);
    ShapeType GetShapeType() const { return m_shapeType; }

    void SetScale(float scale) { m_scale = scale; }
    float GetScale() const { return m_scale; }

    void ToggleWireframe();
    bool IsWireframe() const { return m_wireframe; }

public:
    std::string id;

private:
    GLuint LoadShader(GLenum type, const char *shaderSrc);
    GLuint CreateProgram(const char *vertexShader, const char *fragShader);

    void GenerateGeometry();
    void GenerateTetrahedron();
    void GenerateSphere();
    void GenerateCube();
    void GenerateCone();

    void AddTriangle(
        float x1, float y1, float z1,
        float x2, float y2, float z2,
        float x3, float y3, float z3,
        float r, float g, float b);

    EGLNativeWindowType mEglWindow = 0;
    EGLDisplay mEGLDisplay = EGL_NO_DISPLAY;
    EGLConfig mEGLConfig = nullptr;
    EGLContext mEGLContext = EGL_NO_CONTEXT;
    EGLContext mSharedEGLContext = EGL_NO_CONTEXT;
    EGLSurface mEGLSurface = nullptr;

    GLuint mProgramHandle = 0;
    float angleX = 30.0;
    float angleY = 45.0;
    GLfloat m_widthPercent;

    int m_width = 0;
    int m_height = 0;

    GLint mRotationLocation;
    GLint mTranslationLocation;
    GLint mMoveOriginLocation;

    ShapeType m_shapeType = ShapeType::TETRAHEDRON;
    float m_scale = 1.0f;
    bool m_wireframe = false;

    std::vector<float> m_vertexData;
    std::vector<float> m_colorData;
    std::vector<float> m_normalData;
    int m_vertexCount = TETRAHEDRON_POINT;
};

#endif /* TETRAHEDRON_H */
