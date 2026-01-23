import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';

import { GroupListContext } from '../../app/App.tsx';

import { GRADIENTS } from '../../entities/data/gradients.ts';

export default function GroupList() {

  const navigate = useNavigate();

  const { groupList } = useContext(GroupListContext);

  const lst = groupList.getItems().map(
    (group) => 
      <Link key={group.getId()} to={`/groups/${group.getId()}`}>
        <div style={{ background: GRADIENTS[group.getId() % 15], padding: '1rem', marginBottom: '1rem', border: '0px', borderRadius: '0.2rem' }} >
            <b>{group.getName()}</b><br/>
            <span>{group.getCount()} member(s)</span>
        </div>
      </Link>
  );

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', top: 0, left: 0, width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="person-plus" label="Add group" style={{ fontSize: '1.5rem', float: 'right' }} onClick={()=>navigate('/groups/new')} />
          <h2 style={{ clear: 'both' }}>Your groups</h2>
        </div>
      </div>
      <div style={{ left: 0, width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
        {lst}
      </div>
    </>
  );

}