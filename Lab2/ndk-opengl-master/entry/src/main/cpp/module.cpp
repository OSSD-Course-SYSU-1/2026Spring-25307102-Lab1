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

#include <napi/native_api.h>
#include "napi_manager.h"
#include "app_napi.h"

static napi_value objectPassing(napi_env env, napi_callback_info info)
{
    napi_status status;
    size_t argc = 1;
    napi_value argv[1];

    status = napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
    if (status != napi_ok) {
        return nullptr;
    }

    uint32_t length = 0;
    uint32_t i;
    napi_value keys;
    status = napi_get_all_property_names(env, argv[0], napi_key_own_only,
                                         static_cast<napi_key_filter>(napi_key_enumerable | napi_key_skip_symbols),
                                         napi_key_numbers_to_strings, &keys);
    if (status != napi_ok) {
        return nullptr;
    }

    status = napi_get_array_length(env, keys, &length);
    if (status != napi_ok) {
        return nullptr;
    }

    for (i = 0; i < length; i++) {
        napi_value key;
        status = napi_get_element(env, keys, i, &key);
        if (status != napi_ok) {
            return nullptr;
        }

        napi_valuetype type;
        napi_value value;
        status = napi_get_property(env, argv[0], key, &value);
        napi_typeof(env, value, &type);

        if (type == napi_string) {
            size_t bufSize = 0;
            napi_get_value_string_utf8(env, value, nullptr, 0, &bufSize);
            char *strBuffer = new char[bufSize + 1];
            napi_get_value_string_utf8(env, value, strBuffer, bufSize + 1, &bufSize);
            delete[] strBuffer;
        } else if (type == napi_number) {
            double number;
            napi_get_value_double(env, value, &number);
        }
    }

    return nullptr;
}

static napi_value Init(napi_env env, napi_value exports)
{
    napi_property_descriptor desc[] = {
        DECLARE_NAPI_FUNCTION("getContext", NapiManager::GetContext),
        DECLARE_NAPI_FUNCTION("updateAngle", AppNapi::UpdateAngle),
        DECLARE_NAPI_FUNCTION("setRotate", AppNapi::SetRotate),
        DECLARE_NAPI_FUNCTION("selectShape", AppNapi::SelectShape),
        DECLARE_NAPI_FUNCTION("toggleWireframe", AppNapi::ToggleWireframe),
        DECLARE_NAPI_FUNCTION("setScale", AppNapi::SetScale),
        {"objectPassing", nullptr, objectPassing, nullptr, nullptr, nullptr, napi_default, nullptr}
    };

    napi_define_properties(env, exports, sizeof(desc) / sizeof(desc[0]), desc);

    NapiManager::GetInstance()->Export(env, exports);

    return exports;
}

static napi_module demoModule = {
    .nm_version = 1,
    .nm_flags = 0,
    .nm_filename = nullptr,
    .nm_register_func = Init,
    .nm_modname = "entry",
    .nm_priv = nullptr,
    .reserved = {0},
};

extern "C" __attribute__((constructor)) void RegisterEntryModule(void)
{
    napi_module_register(&demoModule);
}
