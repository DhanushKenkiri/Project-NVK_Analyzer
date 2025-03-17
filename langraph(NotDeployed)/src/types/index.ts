export interface Node {
    id: string;
    label: string;
    data?: any;
}

export interface Edge {
    from: string;
    to: string;
    label?: string;
}