/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { BlogPost } from '../services/blogPosts';
import SupportCTA from './SupportCTA';

interface BlogPostPageProps {
  post: BlogPost;
  onGoBack: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ post, onGoBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="border-b border-[var(--panel-border)] pb-4 mb-6">
           <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors mb-4"
          >
            &larr; Back to all posts
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--accent-color)]">{post.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-2">{post.date} &bull; By {post.author}</p>
        </div>
        {/* FIX: Use dangerouslySetInnerHTML to render the blog post content, which is now an HTML string. */}
        <div
          className="text-[var(--text-muted)] space-y-4 leading-relaxed blog-post-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <SupportCTA
          headline="Want to respond or pitch a follow-up?"
          description="Send your thoughts, corrections, or fan mail—everything lands in the same inbox."
        />
      </div>
    </div>
  );
};

export default BlogPostPage;
