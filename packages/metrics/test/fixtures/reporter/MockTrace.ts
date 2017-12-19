export function mockTrace(now) {
  return {
    'timestamp': now,
    'appName': 'DEFAULT_APP',
    'traceId': '1e084d5515118598316151001dd73d',
    'duration': 139,
    'pid': process.pid,
    'ip': '127.0.0.1',
    'spans': [{
        'name': 'http',
        'startMs': 1511859831616,
        'duration': 138,
        'context': {
          'traceId': '1e084d5515118598316151001dd73d',
          'spanId': '6f0f2be0d9e9a9e9'
        },
        'references': [],
        'tags': {
          'http.method': {
            'value': 'GET',
            'type': 'string'
          },
          'http.url': {
            'value': '/',
            'type': 'string'
          },
          'http.client': {
            'value': false,
            'type': 'bool'
          },
          'rpc_type': {
            'value': 0,
            'type': 'number'
          },
          'http.status_code': {
            'type': 'number',
            'value': 200
          }
        },
        'logs': [],
      },
      {
        'name': 'urllib',
        'startMs': 1511859831630,
        'duration': 26,
        'context': {
          'traceId': '1e084d5515118598316151001dd73d',
          'parentId': '6f0f2be0d9e9a9e9',
          'spanId': 'dee780f60a7a0128'
        },
        'references': [{
          'traceId': '1e084d5515118598316151001dd73d',
          'spanId': '6f0f2be0d9e9a9e9'
        }],
        'tags': {
          'http.method': {
            'value': 'get',
            'type': 'string'
          },
          'http.url': {
            'value': 'http://www.taobao.com/',
            'type': 'string'
          },
          'rpc_type': {
            'value': 25,
            'type': 'number'
          },
          'http.client': {
            'value': true,
            'type': 'bool'
          },
          'error': {
            'type': 'bool',
            'value': false
          },
          'http.status_code': {
            'type': 'number',
            'value': 302
          }
        },
        'logs': [],
      },
      {
        'name': 'urllib',
        'startMs': 1511859831657,
        'duration': 13,
        'context': {
          'traceId': '1e084d5515118598316151001dd73d',
          'parentId': 'dee780f60a7a0128',
          'spanId': '7e0ad5af842f307a'
        },
        'references': [{
          'traceId': '1e084d5515118598316151001dd73d',
          'parentId': '6f0f2be0d9e9a9e9',
          'spanId': 'dee780f60a7a0128'
        }],
        'tags': {
          'http.method': {
            'value': 'get',
            'type': 'string'
          },
          'http.url': {
            'value': 'http://www.taobao.com/1511859831657',
            'type': 'string'
          },
          'rpc_type': {
            'value': 25,
            'type': 'number'
          },
          'http.client': {
            'value': true,
            'type': 'bool'
          },
          'error': {
            'type': 'bool',
            'value': false
          },
          'http.status_code': {
            'type': 'number',
            'value': 302
          }
        },
        'logs': [],
      },
      {
        'name': 'urllib',
        'startMs': 1511859831658,
        'duration': 94,
        'context': {
          'traceId': '1e084d5515118598316151001dd73d',
          'parentId': 'dee780f60a7a0128',
          'spanId': '24b04980ddd1774f'
        },
        'references': [{
          'traceId': '1e084d5515118598316151001dd73d',
          'parentId': '6f0f2be0d9e9a9e9',
          'spanId': 'dee780f60a7a0128'
        }],
        'tags': {
          'http.method': {
            'value': 'get',
            'type': 'string'
          },
          'http.url': {
            'value': 'http://www.1511859831658notfound.com/',
            'type': 'string'
          },
          'rpc_type': {
            'value': 25,
            'type': 'number'
          },
          'http.client': {
            'value': true,
            'type': 'bool'
          },
          'error': {
            'type': 'bool',
            'value': true
          },
          'http.status_code': {
            'type': 'number',
            'value': -1
          }
        },
        'logs': [],
      }
    ]
  }
}
