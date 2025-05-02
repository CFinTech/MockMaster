import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/MainPage.vue'
import Resume from '../views/Resume.vue'
import SingleResume from '../views/SingleResume.vue'

const routes = [
    {
        path: '/',
        component: Home
    },
    {
        path: '/resumes',
        component: Resume
    },
    {
        path: '/singleresume',
        component: SingleResume,
        meta: { layout: false }   // 这一页不使用全局 layout
    }
]

export default createRouter({
    history: createWebHistory(),
    routes
})
