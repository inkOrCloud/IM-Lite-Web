import { QueryClient } from "@tanstack/react-query";

const QueryClientInstance = new QueryClient(
    {
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: false,
                retry: 3,
                staleTime: 1000 * 60 * 10, // 10 minutes
                gcTime: 1000 * 60 * 30, // 30 minutes
            },
        },
    }
)
export default QueryClientInstance
