/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { blogPosts } from '../services/blogPosts';
import SupportCTA from './SupportCTA';

interface BlogPageProps {
  onGoBack: () => void;
  onSelectPost: (slug: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ onGoBack, onSelectPost }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8 animate-fade-in">
      <div className="bg-[var(--panel-bg)] backdrop-blur-lg border border-[var(--panel-border)] rounded-xl shadow-lg p-6 md:p-10">
        <div className="flex justify-between items-center border-b border-[var(--panel-border)] pb-4 mb-8">
          <h1 className="text-3xl font-bold text-[var(--accent-color)]">The Tea</h1>
          <button
            onClick={onGoBack}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-color)] transition-colors"
          >
            &larr; Back to the lab
          </button>
        </div>
        <div className="space-y-6">
          {blogPosts.map((post) => (
            <div
              key={post.slug}
              onClick={() => onSelectPost(post.slug)}
              className="p-6 border border-[var(--panel-border)] rounded-lg hover:bg-[var(--control-bg)] cursor-pointer transition-colors"
            >
              <h2 className="text-xl font-bold text-[var(--accent-color)] mb-1">{post.title}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-3">{post.date} &bull; By {post.author}</p>
              <p className="text-[var(--text-muted)] text-sm">Click to read more &rarr;</p>
            </div>
          ))}
        </div>
        <SupportCTA
          headline="Got story ideas or feedback on our hot takes?"
          description="Share what you'd like to see on the blog or send over your own handwriting hacks."
        />
      </div>
    </div>
  );
};

export default BlogPage;
