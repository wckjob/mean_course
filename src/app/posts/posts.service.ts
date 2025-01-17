import { Injectable } from "@angular/core";
import { Post } from "./post.model";
import { Subject, map } from "rxjs"
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { environment } from "../../environments/environment";

const BACKEND_URL = environment.apiUrl + '/posts';

@Injectable({providedIn: 'root'})
export class PostService {
    private posts: Post[] = [];
    private postsUpdated = new Subject<{posts: Post[], postCount: number}>();

    constructor(private http: HttpClient, private router: Router) {}

    getPosts(postsPerPage: number, currentPage: number) {
        const queryParams =  `?pageSize=${postsPerPage}&page=${currentPage}`;
        this.http.get<{message: string, posts: any, maxPosts: number}>(BACKEND_URL + queryParams)
        .pipe(map((postData) => {
            return {
                posts: postData.posts.map((post: any) => {
                    return {
                        title: post.title,
                        content: post.content,
                        id: post._id,
                        imagePath : post.imagePath,
                        creator: post.creator
                    };
                }), maxPosts: postData.maxPosts
            };
          })
        )
        .subscribe((transformedPostData) => {
            this.posts = transformedPostData.posts;
            this.postsUpdated.next({posts: [...this.posts], postCount: transformedPostData.maxPosts});
        });
    }

    getPostUpdateListener() {
        return this.postsUpdated.asObservable();
    }

    getPost(id: string) {
        return this.http.get<{_id: string, title: string, content: string, imagePath: string, creator: string}>
        (BACKEND_URL + id);
    }

    addPost(title: string, content: string, image: File) {
        const postData = new FormData();
        postData.append("title", title);
        postData.append("content", content);
        postData.append("image", image, title);

        this.http.post<{post: Post}>(BACKEND_URL, postData)
            .subscribe((responseData) => {
                this.router.navigate(['/']);
            });
    }

    updatePost(id: string, title: string, content: string, image: File | string) {
        let postData: Post | FormData;
        if (typeof(image) === 'object') {
            postData = new FormData();
            postData.append("title", title);
            postData.append("content", content);
            postData.append("image", image, title);
        } else {
            postData = {id: id, title: title, content: content, imagePath: image,
                creator: null as any
            };
        }
        this.http.put(BACKEND_URL + '/' + id, postData)
            .subscribe(response => {
                this.router.navigate(['/']);
            });
    }

    deletePost(postId: string) {
        return this.http.delete('http://localhost:3000/api/posts/' + postId);
    }
}