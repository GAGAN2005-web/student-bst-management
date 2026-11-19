from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Student BST Management API",
    version="1.0.0",
    description="Student Record Management System using a Binary Search Tree."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Student(BaseModel):
    student_id: int = Field(gt=0)
    name: str = Field(min_length=1, max_length=100)
    course: str = Field(min_length=1, max_length=100)
    cgpa: float = Field(ge=0, le=10)


class Node:
    def __init__(self, student: Student):
        self.student = student
        self.left: Optional["Node"] = None
        self.right: Optional["Node"] = None


class StudentBST:
    def __init__(self):
        self.root: Optional[Node] = None

    def insert(self, student: Student) -> bool:
        new_node = Node(student)
        if self.root is None:
            self.root = new_node
            return True

        current = self.root
        while True:
            if student.student_id < current.student.student_id:
                if current.left is None:
                    current.left = new_node
                    return True
                current = current.left
            elif student.student_id > current.student.student_id:
                if current.right is None:
                    current.right = new_node
                    return True
                current = current.right
            else:
                return False

    def search_node(self, student_id: int) -> Optional[Node]:
        current = self.root
        while current is not None:
            if student_id == current.student.student_id:
                return current
            current = current.left if student_id < current.student.student_id else current.right
        return None

    def search(self, student_id: int) -> Optional[Student]:
        node = self.search_node(student_id)
        return node.student if node else None

    def update(self, student_id: int, student: Student) -> bool:
        node = self.search_node(student_id)
        if node is None:
            return False
        if student.student_id != student_id and self.search_node(student.student_id):
            return False
        node.student = student
        return True

    def inorder(self, node: Optional[Node], result: list[Student]):
        if node is None:
            return
        self.inorder(node.left, result)
        result.append(node.student)
        self.inorder(node.right, result)

    def get_all(self) -> list[Student]:
        result = []
        self.inorder(self.root, result)
        return result

    def find_min(self, node: Node) -> Node:
        current = node
        while current.left is not None:
            current = current.left
        return current

    def delete(self, node: Optional[Node], student_id: int) -> Optional[Node]:
        if node is None:
            return None

        if student_id < node.student.student_id:
            node.left = self.delete(node.left, student_id)
        elif student_id > node.student.student_id:
            node.right = self.delete(node.right, student_id)
        else:
            if node.left is None:
                return node.right
            if node.right is None:
                return node.left

            successor = self.find_min(node.right)
            node.student = successor.student
            node.right = self.delete(node.right, successor.student.student_id)

        return node

    def remove(self, student_id: int) -> bool:
        if self.search(student_id) is None:
            return False
        self.root = self.delete(self.root, student_id)
        return True

    def tree_data(self):
        def build(node):
            if node is None:
                return None
            return {
                "student_id": node.student.student_id,
                "name": node.student.name,
                "course": node.student.course,
                "cgpa": node.student.cgpa,
                "left": build(node.left),
                "right": build(node.right),
            }
        return build(self.root)

    def height(self, node: Optional[Node]) -> int:
        if node is None:
            return 0
        return 1 + max(self.height(node.left), self.height(node.right))


bst = StudentBST()

@app.get("/")
def root():
    return {"message": "Student BST Management API is running"}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/students")
def get_students():
    students = bst.get_all()
    return {
        "students": [s.model_dump() for s in students],
        "count": len(students),
        "height": bst.height(bst.root)
    }

@app.post("/api/students", status_code=201)
def add_student(student: Student):
    if not bst.insert(student):
        raise HTTPException(status_code=409, detail="Student ID already exists.")
    return {"message": "Student added successfully.", "student": student.model_dump()}

@app.get("/api/students/{student_id}")
def get_student(student_id: int):
    student = bst.search(student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    return student.model_dump()

@app.put("/api/students/{student_id}")
def update_student(student_id: int, student: Student):
    if bst.search(student_id) is None:
        raise HTTPException(status_code=404, detail="Student not found.")
    if not bst.update(student_id, student):
        raise HTTPException(status_code=409, detail="New Student ID already exists.")
    return {"message": "Student updated successfully.", "student": student.model_dump()}

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    if not bst.remove(student_id):
        raise HTTPException(status_code=404, detail="Student not found.")
    return {"message": "Student deleted successfully."}

@app.get("/api/tree")
def get_tree():
    return {
        "tree": bst.tree_data(),
        "height": bst.height(bst.root)
    }
