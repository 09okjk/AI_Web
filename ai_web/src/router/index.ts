import * as VueRouter from 'vue-router'
const { createRouter, createWebHistory } = VueRouter

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/list'
    },
    {
      path: '/list',
      name: 'DocumentList',
      component: () => import('../views/DocumentList.vue'),
      meta: {
        title: '文档列表'
      }
    },
    {
      path: '/editor',
      name: 'DocumentEditor',
      component: () => import('../views/DocumentEditor.vue'),
      meta: {
        title: '新建文档'
      }
    },
    {
      path: '/editor/:id',
      name: 'DocumentEditorEdit',
      component: () => import('../views/DocumentEditor.vue'),
      meta: {
        title: '编辑文档'
      }
    }
  ]
})

export default router