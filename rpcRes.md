1. get-stats => {
    "error": null,
    "id": 1,
    "jsonrpc": "2.0",
    "result": {
        "active_streams": 2,
        "cpu_percent": 0.4934210181236267,
        "current_index": 18,
        "file_size": 219000000000,
        "last_updated": 1765306922,
        "packets_received": 3214911,
        "packets_sent": 3685501,
        "ram_total": 12541607936,
        "ram_used": 753451008,
        "total_bytes": 99230,
        "total_pages": 0,
        "uptime": 103309
    }
}

2. get-pods-with-stats => {
    "error": null,
    "id": 1,
    "jsonrpc": "2.0",
    "result": {
        "pods": [
            {
                "address": "173.212.207.32:9001",
                "is_public": true,
                "last_seen_timestamp": 1765873173,
                "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
                "rpc_port": 6000,
                "storage_committed": 340000000000,
                "storage_usage_percent": 0.000028513823529411764,
                "storage_used": 96947,
                "uptime": 103334,
                "version": "0.8.0"
            },
            {
                "address": "152.53.155.15:9001",
                "is_public": true,
                "last_seen_timestamp": 1765873168,
                "pubkey": "6PbJSbfG4pMneMoizZFNEfNkmBrL6frenKmDbqbBDcKq",
                "rpc_port": 6000,
                "storage_committed": 10737418240,
                "storage_usage_percent": 0.0,
                "storage_used": 0,
                "uptime": 45630,
                "version": "0.8.0"
            },
            {
                "address": "77.53.105.8:9001",
                "is_public": false,
                "last_seen_timestamp": 1765873166,
                "pubkey": "Bfn2sfa9yaDkShq4Mq2eMmdTw35yJxPyzCiytNiqSxCX",
                "rpc_port": 6000,
                "storage_committed": 17580000000000,
                "storage_usage_percent": 0.0,
                "storage_used": 0,
                "uptime": 51164,
                "version": "0.8.0"
            },
            {
                "address": "46.250.240.112:9001",
                "is_public": false,
                "last_seen_timestamp": 1765873170,
                "pubkey": "CARBzqr4m6HLoKQkkUfwVFf9SRzk1UY3dk17UzAaW48H",
                "rpc_port": 6000,
                "storage_committed": 368000000000,
                "storage_usage_percent": 0.00002548505434782609,
                "storage_used": 93785,
                "uptime": 137992,
                "version": "0.8.0"
            },
           ..........
        ],
        "total_count": 198
    }
}


3. get-pods => {
    "error": null,
    "id": 1,
    "jsonrpc": "2.0",
    "result": {
        "pods": [
            {
                "address": "173.212.207.32:9001",
                "last_seen_timestamp": 1765873716,
                "pubkey": "EcTqXgB6VJStAtBZAXcjLHf5ULj41H1PFZQ17zKosbhL",
                "version": "0.8.0"
            },
            {
                "address": "152.53.155.15:9001",
                "last_seen_timestamp": 1765873723,
                "pubkey": "6PbJSbfG4pMneMoizZFNEfNkmBrL6frenKmDbqbBDcKq",
                "version": "0.8.0"
            },
            .....
        ],
        "total_count": 198
    }
}