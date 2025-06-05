import React from 'react';
import Feed from '../components/Feed';
import Sidebar from '../components/Sidebar';

import './Home.css';

function Home({ posts, setPosts, suggestedUsers, setSuggestedUsers, users, currentUser }) {
  return (
    <div className="home">
      <div className="home-container">
        <div className="home-feed">
          <Feed posts={posts} setPosts={setPosts} users={users} />
        </div>
        <div className="home-sidebar">
          <Sidebar
            suggestedUsers={suggestedUsers}
            setSuggestedUsers={setSuggestedUsers}
            users={users}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;