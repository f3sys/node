import { createRouter, createWebHistory } from 'vue-router';
import { useNodeStore } from '../stores/node';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/login",
            name: "login",
            component: () => import('../views/LoginView.vue')
        },
        {
            path: "/food",
            name: "food",
            component: () => import('../views/FoodView.vue'),
        },
        {
            path: "/exhibition",
            name: "exhibition",
            component: () => import('../views/ExhibitionView.vue'),
        },
        {
            path: "/entry",
            name: "entry",
            component: () => import('../views/EntryView.vue'),
        },
        {
            path: "/battery",
            name: "battery",
            component: () => import('../views/BatteryView.vue'),
        },
        {
            path: "/helper",
            name: "helper",
            component: () => import('../views/HelperView.vue'),
        }
    ]
})

router.beforeEach((to, _, next) => {
    const nodeStore = useNodeStore();

    switch (nodeStore.type) {
        case "FOODSTALL":
            if (to.name !== "food") {
                next("/food"); // Redirect to food if not already there
            } else {
                next(); // Proceed if already on food page
            }
            break;
        case "EXHIBITION":
            if (to.name !== "exhibition") {
                next("/exhibition"); // Redirect to exhibition if not already there
            } else {
                next(); // Proceed if already on exhibition page
            }
            break;
        case "ENTRY":
            if (to.name !== "entry") {
                next("/entry"); // Redirect to entry if not already there
            } else {
                next(); // Proceed if already on entry page
            }
            break;
        case "BATTERY":
            if (to.name !== "battery") {
                next("/battery"); // Redirect to battery if not already there
            } else {
                next(); // Proceed if already on battery page
            }
            break;
        default:
            if (to.name !== "login") {
                next("/login"); // Redirect to login if not already there
            } else {
                next(); // Proceed if already on login page
            }
            break;
    }
});

export default router
