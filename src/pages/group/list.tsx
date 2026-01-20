import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SlCard from '@shoelace-style/shoelace/dist/react/card';
import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';

import { GroupListContext } from '../../app/App.tsx';

export default function GroupList() {

  const navigate = useNavigate();

  const { groupList } = useContext(GroupListContext);

  const lst = groupList.getItems().map(
    (group) => 
      <Link key={group.getId()} to={`/groups/${group.getId()}`}>
        <SlCard style={{ width: '100%', marginBottom: '1rem' }}>
          <b>{group.getName()}</b><br/>
          <span>{group.getCount()} member(s)</span>
        </SlCard>
      </Link>
  );

  return (
    <>
      <SlIconButton name="person-plus" label="Add group" style={{ fontSize: '1.5rem', float: 'right' }} onClick={()=>navigate('/groups/new')} />
      <h1 style={{ clear: 'both' }}>Your groups</h1>
      {lst}
    </>
  );

}