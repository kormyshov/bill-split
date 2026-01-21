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
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', position: 'absolute', top: 0, left: 0, width: '100%', height: '20%', boxSizing: 'border-box', alignItems: 'center', display: 'flex' }}>
        <div style={{ padding: '1rem', width: '100%' }}>
          <SlIconButton name="person-plus" label="Add group" style={{ fontSize: '1.5rem', position: 'absolute', top: '1rem', right: '1rem' }} onClick={()=>navigate('/groups/new')} />
          <h1 style={{ clear: 'both' }}>Your groups</h1>
        </div>
      </div>
      <div style={{ position: 'absolute', top: '20%', left: 0, width: '100%', height: '80%', boxSizing: 'border-box', padding: '1rem' }}>
        {lst}
      </div>
    </>
  );

}