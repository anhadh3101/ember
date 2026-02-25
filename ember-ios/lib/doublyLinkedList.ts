export class Node<T> {
    public next: Node<T> | null = null;
    public prev: Node<T> | null = null;

    constructor(public data: T) {}
}

export class DoublyLinkedList<T> {
    private head: Node<T> | null = null;
    private tail: Node<T> | null = null;
    private size: number = 0;

    public append(data: T): void {
        const newNode: Node<T> = new Node(data);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            newNode.prev = this.tail;
            this.tail!.next = newNode;
            this.tail = newNode;
        }
        this.size++;
    }

    public prepend(data: T): void {
        const newNode: Node<T> = new Node(data);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head!.prev = newNode;
            this.head = newNode;
        }
        this.size++;
    }
}