#include <chrono>
#include <iostream>
#include <map>
#include <nan.h>

namespace DiagProbe {

using hrtime = std::chrono::time_point<std::chrono::high_resolution_clock>;
using nanoseconds = std::chrono::nanoseconds;
using milliseconds = std::chrono::milliseconds;

#define GcType(V)                                                              \
  V(scavenge)                                                                  \
  V(mark_sweep_compact)                                                        \
  V(incremental_marking)                                                       \
  V(process_weak_callbacks)

struct GcStatistics {
public:
  unsigned long total_gc_times = 0;
  nanoseconds total_gc_duration;
  nanoseconds total_gc_duration_max;
  nanoseconds total_gc_duration_min;
#define V(TYPE)                                                                \
  unsigned long TYPE##_times = 0;                                              \
  nanoseconds TYPE##_duration;                                                 \
  nanoseconds TYPE##_duration_max;                                             \
  nanoseconds TYPE##_duration_min;
  GcType(V)
#undef V

      hrtime last_prologue_time;
};

static std::mutex statistics_data_mutex;
static std::map<v8::Isolate *, GcStatistics *> statistics_data;

NAN_GC_CALLBACK(GCPrologueCallback) {
  GcStatistics *item;
  {
    std::lock_guard<std::mutex> lock{statistics_data_mutex};
    item = statistics_data[isolate];
  }
  if (item == nullptr) {
    return;
  }
  item->last_prologue_time = std::chrono::high_resolution_clock::now();
}

NAN_GC_CALLBACK(GCEpilogueCallback) {
  GcStatistics *item;
  {
    std::lock_guard<std::mutex> lock{statistics_data_mutex};
    item = statistics_data[isolate];
  }
  if (item == nullptr) {
    return;
  }
  auto end = std::chrono::high_resolution_clock::now();
  auto start = item->last_prologue_time;
  item->last_prologue_time = hrtime();

  auto duration = end - start;
  item->total_gc_times++;
  item->total_gc_duration += duration;

#define V(TYPE, KEY)                                                           \
  case v8::GCType::TYPE: {                                                     \
    item->KEY##_times++;                                                       \
    item->KEY##_duration += duration;                                          \
    if (duration > item->KEY##_duration_max) {                                 \
      item->KEY##_duration_max = duration;                                     \
    }                                                                          \
    if (duration < item->KEY##_duration_min) {                                 \
      item->KEY##_duration_min = duration;                                     \
    }                                                                          \
    break;                                                                     \
  }

  switch (type) {
    V(kGCTypeScavenge, scavenge)
    V(kGCTypeMarkSweepCompact, mark_sweep_compact)
    V(kGCTypeIncrementalMarking, incremental_marking)
    V(kGCTypeProcessWeakCallbacks, process_weak_callbacks)
  }
#undef V
}

void Setup(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  v8::Isolate *isolate = info.GetIsolate();
  Nan::AddGCPrologueCallback(GCPrologueCallback);
  Nan::AddGCEpilogueCallback(GCEpilogueCallback);
  {
    std::lock_guard<std::mutex> lock{statistics_data_mutex};
    statistics_data[isolate] = new GcStatistics();
  }

  info.GetReturnValue().Set(Nan::Undefined());
}

void Teardown(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  v8::Isolate *isolate = info.GetIsolate();
  Nan::RemoveGCPrologueCallback(GCPrologueCallback);
  Nan::RemoveGCEpilogueCallback(GCEpilogueCallback);
  {
    std::lock_guard<std::mutex> lock{statistics_data_mutex};
    delete statistics_data[isolate];
    statistics_data.erase(isolate);
  }

  info.GetReturnValue().Set(Nan::Undefined());
}

void GetStatistics(const Nan::FunctionCallbackInfo<v8::Value> &info) {
  v8::Isolate *isolate = info.GetIsolate();
  GcStatistics *item;
  {
    std::lock_guard<std::mutex> lock{statistics_data_mutex};
    item = statistics_data[isolate];
  }
  if (item == nullptr) {
    info.GetReturnValue().Set(Nan::Undefined());
    return;
  }

  v8::Local<v8::Object> ret = Nan::New<v8::Object>();

#define VV(KEY)                                                                \
  {                                                                            \
    auto number =                                                              \
        std::chrono::duration_cast<std::chrono::milliseconds>(item->KEY);      \
    auto js_number = Nan::New<v8::Number>(number.count());                     \
    Nan::Set(ret, Nan::New(#KEY).ToLocalChecked(), js_number);                 \
  }
#define V(KEY)                                                                 \
  VV(KEY##_duration)                                                           \
  VV(KEY##_duration_min)                                                       \
  VV(KEY##_duration_max)
  V(total_gc)
  GcType(V)
#undef V
#undef VV

#define VV(KEY)                                                                \
  {                                                                            \
    auto js_number = Nan::New<v8::Number>(item->KEY);                          \
    Nan::Set(ret, Nan::New(#KEY).ToLocalChecked(), js_number);                 \
  }
#define V(KEY) VV(KEY##_times)
      V(total_gc) GcType(V)
#undef V
#undef VV

          info.GetReturnValue()
              .Set(ret);
}

void Init(v8::Local<v8::Object> exports) {
  v8::Isolate *isolate = exports->GetIsolate();
  v8::Local<v8::Context> context = exports->CreationContext();
  exports->Set(context, Nan::New("setup").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(Setup)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context, Nan::New("teardown").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(Teardown)
                   ->GetFunction(context)
                   .ToLocalChecked());
  exports->Set(context, Nan::New("getStatistics").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(GetStatistics)
                   ->GetFunction(context)
                   .ToLocalChecked());
}

} // namespace DiagProbe

NODE_MODULE_CONTEXT_AWARE(hello, DiagProbe::Init)
