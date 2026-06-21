import { db } from "@/lib/firebase/server";
import type { GeneratedPost } from "@/lib/types";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { deleteFromCloudinary } from "@/lib/cloudinary";

export async function createGeneratedPost(
  post: Omit<GeneratedPost, "id" | "created_at" | "updated_at">
): Promise<GeneratedPost> {
  const docRef = db.collection("generated_posts").doc();
  const newPost: GeneratedPost = {
    ...post,
    id: docRef.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await docRef.set(newPost);
  return newPost;
}

export async function getUserPosts(userId: string): Promise<GeneratedPost[]> {
  const snapshot = await db
    .collection("generated_posts")
    .where("user_id", "==", userId)
    .orderBy("created_at", "desc")
    .get();

  const posts: GeneratedPost[] = [];
  snapshot.forEach((doc: QueryDocumentSnapshot) => {
    posts.push(doc.data() as GeneratedPost);
  });
  return posts;
}

export async function getPost(id: string, userId: string): Promise<GeneratedPost | null> {
  const doc = await db.collection("generated_posts").doc(id).get();
  if (!doc.exists) return null;
  const post = doc.data() as GeneratedPost;
  if (post.user_id !== userId) return null;
  return post;
}

export async function deleteGeneratedPost(id: string, userId: string): Promise<void> {
  const docRef = db.collection("generated_posts").doc(id);
  const doc = await docRef.get();
  if (doc.exists) {
    const post = doc.data() as GeneratedPost;
    if (post.user_id === userId) {
      if (post.cloudinary_public_id) {
        try {
          await deleteFromCloudinary(post.cloudinary_public_id);
        } catch (error) {
          console.error(`Failed to delete Cloudinary image ${post.cloudinary_public_id} during post deletion:`, error);
        }
      }
      await docRef.delete();
    } else {
      throw new Error("Unauthorized to delete post");
    }
  }
}

export async function updateGeneratedPost(
  id: string,
  userId: string,
  updates: Partial<Omit<GeneratedPost, "id" | "user_id" | "created_at" | "updated_at">>
): Promise<GeneratedPost> {
  const docRef = db.collection("generated_posts").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new Error("Post not found");
  }
  const post = doc.data() as GeneratedPost;
  if (post.user_id !== userId) {
    throw new Error("Unauthorized to update post");
  }

  const updatedData = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  await docRef.update(updatedData);

  const updatedDoc = await docRef.get();
  if (!updatedDoc.exists) {
    throw new Error("Post not found after update");
  }
  return updatedDoc.data() as GeneratedPost;
}

export async function duplicateGeneratedPost(id: string, userId: string): Promise<GeneratedPost> {
  const post = await getPost(id, userId);
  if (!post) throw new Error("Post not found");

  const { id: _, created_at: __, updated_at: ___, is_favorite: ____, is_pinned: _____, is_archived: ______, ...rest } = post;
  
  const duplicatedPost = {
    ...rest,
    title: rest.title ? `${rest.title} (Copy)` : "Copy",
    is_favorite: false,
    is_pinned: false,
    is_archived: false,
  };

  return await createGeneratedPost(duplicatedPost);
}

export async function getUserPostsCountThisWeek(userId: string): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekISO = startOfWeek.toISOString();

  const snapshot = await db
    .collection("generated_posts")
    .where("user_id", "==", userId)
    .where("created_at", ">=", startOfWeekISO)
    .count()
    .get();

  return snapshot.data().count;
}

export async function getUserAveragePostLength(userId: string): Promise<number> {
  const snapshot = await db
    .collection("generated_posts")
    .where("user_id", "==", userId)
    .get();

  if (snapshot.empty) return 0;

  let totalLength = 0;
  let count = 0;
  snapshot.forEach((doc: QueryDocumentSnapshot) => {
    const post = doc.data() as GeneratedPost;
    totalLength += post.content?.length || 0;
    count++;
  });

  return Math.round(totalLength / count);
}
