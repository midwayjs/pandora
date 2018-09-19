'use strict';

module.exports = {
  base: '/pandora/',
  locales: {
    '/': {
      lang: 'en-US',
      title: 'Pandora.js',
      description: 'A Manageable, Measurable and Traceable Node.js Application Manager'
    },
    '/zh-cn/': {
      lang: 'zh-cn-CN',
      title: 'Pandora.js',
      description: '一个可管理、可度量、可追踪的 Node.js 应用管理器'
    }
  },
  themeConfig: {
    lang: 'zh-cn-CN',
    title: 'Pandora.js',
    description: '一个可管理、可度量、可追踪的 Node.js 应用管理器',
    repo: 'midwayjs/pandora',
    docsDir: 'docs',
    editLinks: true,
    serviceWorker: {
      updatePopup: true
    },
    locales: {
      '/': {
        selectText: 'Languages',
        label: 'English',
        lastUpdated: 'Last Updated',
        editLinkText: 'Edit this page on GitHub',
        algolia: {},
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Quick Start', link: '/quickstart' },
          { text: 'Guide', link: '/guide/introduce' },
          { text: 'API reference', link: '/api' },
          {
            text: 'MidwayJs Products',
            items: [
              {
                text: 'Web Framework',
                items: [
                  { text: 'Midway - Future-oriented web full stack framework', link: 'http://midwayjs.org/midway' },
                ]
              },
              {
                text: 'Application Management',
                items: [
                  { text: 'Pandora.js - Node.js Application Manager', link: '/' },
                ]
              },
              {
                text: 'Node.js Monitoring Platform',
                items: [
                  { text: 'Sandbox - Privatized node. js monitoring product', link: '#' },
                ]
              }
            ]
          }
        ],
        sidebar: {
          '/guide/': [
            {
              title: 'Overview',
              collapsable: false,
              children: [
                'introduce',
                'glossary'
              ]
            },
            {
              title: 'Basic Features',
              collapsable: false,
              children: [
                'base/command',
                'other/dashboard',
                'base/procfile_mode',
                'base/dorapan',
                'base/logs',
                'base/global_config',
                'base/quick_monitor',
                'base/debug'
              ]
            },
            {
              title: 'Advanced Processes Model',
              collapsable: false,
              children: [
                'process/process_std',
                'process/service_std',
                'process/fork_and_cluster',
                'process/environment_std',
                'process/application_life_cycle',
                'process/ipc_hub'
              ]
            },
            {
              title: 'Application Monitoring',
              collapsable: false,
              children: [
                'monitor/monitor_std',
                'monitor/resource',
                'monitor/trace',
                'monitor/monitor_inner',
                'monitor/endpoint',
                'monitor/metrics',
                'monitor/report'
              ]
            },
            {
              title: 'Monitoring Data Collection',
              collapsable: false,
              children: [
                'collect/health'
              ]
            },
            {
              title: 'Extension',
              collapsable: false,
              children: [
                'other/typescript'
              ]
            }
          ]
        }
      },
      '/zh-cn/': {
        // 多语言下拉菜单的标题
        selectText: '选择语言',
        // 该语言在下拉菜单中的标签
        label: '简体中文',
        lastUpdated: '上次更新',
        // 编辑链接文字
        editLinkText: '在 GitHub 上编辑此页',
        // 当前 locale 的 algolia docsearch 选项
        algolia: {},
        nav: [
          { text: '首页', link: '/zh-cn/' },
          { text: '快速上手', link: '/zh-cn/quickstart' },
          { text: '使用指南', link: '/zh-cn/guide/introduce' },
          { text: 'API 接口', link: '/zh-cn/api' },
          {
            text: 'MidwayJs 系列产品',
            items: [
              {
                text: '框架',
                items: [
                  { text: 'Midway - 面向未来的 Web 全栈框架', link: 'http://midwayjs.org/midway' },
                ]
              },
              {
                text: '应用管理',
                items: [
                  { text: 'Pandora.js - Node.js 应用管理器', link: '/' },
                ]
              },
              {
                text: '监控产品',
                items: [
                  { text: 'Sandbox - 私有化 Node.js 监控产品', link: '#' },
                ]
              }
            ]
          }
        ],
        sidebar: {
          '/zh-cn/guide/': [
            {
              title: '概述',
              collapsable: false,
              children: [
                'introduce',
                'glossary'
              ]
            },
            {
              title: '基础功能',
              collapsable: false,
              children: [
                'base/command',
                'other/dashboard',
                'base/procfile_mode',
                'base/dorapan',
                'base/logs',
                'base/global_config',
                'base/quick_monitor',
                'base/debug'
              ]
            },
            {
              title: '进程管理进阶',
              collapsable: false,
              children: [
                'process/process_std',
                'process/service_std',
                'process/fork_and_cluster',
                'process/environment_std',
                'process/application_life_cycle',
                'process/ipc_hub'
              ]
            },
            {
              title: '应用监控',
              collapsable: false,
              children: [
                'monitor/monitor_std',
                'monitor/resource',
                'monitor/trace',
                'monitor/monitor_inner',
                'monitor/endpoint',
                'monitor/metrics',
                'monitor/report'
              ]
            },
            {
              title: '监控数据采集',
              collapsable: false,
              children: [
                'collect/health'
              ]
            },
            {
              title: '扩展功能',
              collapsable: false,
              children: [
                'other/typescript'
              ]
            }
          ]
        }
      }
    }
  }
};
