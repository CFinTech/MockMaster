import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/MainPage.vue'
import Resume from '../views/Resume.vue'
import SingleResume from '../views/SingleResume.vue'
import Calendar from '../views/Calendar.vue'

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
    },
    {
        path: '/calendar',
        component: Calendar,
    },
]

export default createRouter({
    history: createWebHistory(),
    routes
})
