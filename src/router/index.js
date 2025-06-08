import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/MainPage.vue'
import Resume from '../views/Resume.vue'
import SingleResume from '../views/SingleResume.vue'
import Calendar from '../views/Calendar.vue'
import Interview from '../views/Interview.vue'
import MultiInterview from '../views/MultiInterview.vue'
import Evaluation from '../views/Evaluation.vue'
// import Simulate from '../views/Simulate.vue'


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
    // {
    //     path: '/simulate',
    //     component: Simulate,
    // },
    {
        path: '/interview',
        component: Interview,
        meta: { layout: false }   // 这一页不使用全局 layout
    },
    {
        path: '/multi_interview',
        component: MultiInterview,
        meta: { layout: false }   // 这一页不使用全局 layout
    },
    {
        path: '/evaluation',
        component: Evaluation,
        meta: { layout: false }   // 这一页不使用全局 layout
    },
]


export default createRouter({
    history: createWebHistory(),
    routes
})
