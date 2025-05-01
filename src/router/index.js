// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 以下几个 view 只是示例，你可以按需改名、新建
import Home from '../views/MainPage.vue'
// import MockInterview from '../views/MockInterview.vue'
import Resumes from '../views/Resume.vue'
// import JobTracker from '../views/JobTracker.vue'
// import Calendar from '../views/Calendar.vue'
// import Contact from '../views/Contact.vue'

const routes = [
    { path: '/', component: Home },
    // { path: '/mock', component: MockInterview },
    { path: '/resumes', component: Resumes },
    // { path: '/tracker', component: JobTracker },
    // { path: '/calendar', component: Calendar },
    // { path: '/contact', component: Contact },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
