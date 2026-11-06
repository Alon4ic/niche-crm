import { useAuthStore } from "../stores/authStore";
import { queryClient } from "./queryClient";
import { userIdFromToken } from "./jwt";

useAuthStore.subscribe((state, prev) => {
    if(userIdFromToken(state.accessToken) !== userIdFromToken(prev.accessToken)) {
        queryClient.clear();
    }
});

 