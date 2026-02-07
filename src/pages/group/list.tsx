import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import SlIconButton from '@shoelace-style/shoelace/dist/react/icon-button';
import SlSkeleton from '@shoelace-style/shoelace/dist/react/skeleton';

import { getCommand } from '../../entities/upload/common';

import { GroupListContext } from '../../app/App.tsx';
import { GroupUpdateFlagContext } from '../../app/App.tsx';
import { TGroupList } from '../../entities/types/group/group_list.ts';
import { TGroup } from '../../entities/types/group/group.ts';

import { GRADIENTS } from '../../entities/data/gradients.ts';

export default function GroupList() {

  const navigate = useNavigate();

  const { groupList, setGroupList } = useContext(GroupListContext);
  const { groupUpdateFlag, setGroupUpdateFlag } = useContext(GroupUpdateFlagContext);

  const lst = groupList.getItems().map(
    (group) => 
      <Link key={group.getId()} to={`/groups/${group.getId()}`}>
        <div style={{ background: GRADIENTS[group.getId() % 15], padding: '1rem', marginBottom: '1rem', border: '0px', borderRadius: '0.2rem' }} >
            <b>{group.getName()}</b><br/>
            <span>{group.getCount()} member(s)</span>
        </div>
      </Link>
  );

  useEffect(() => {
    const fetchData = async () => {

      const response = await fetch(getCommand("groups/get_list"))

      const data = await response.json()
      console.log('Input data:', data)
      groupList.clear();
      data.groups.forEach((item: any) => {
        const group = new TGroup(
          item[0],
          item[1],
          item[2],
          item[3],
          item[4],
          item[5]
        );
        groupList.addItem(group);
      })
      setGroupList(new TGroupList(groupList.getItems()));
      setGroupUpdateFlag(false);
    }

    if (groupUpdateFlag) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupUpdateFlag]);

  return (
    <>
      <div style={{ background: 'linear-gradient(rgba(0, 255, 127, 0.4), rgba(0, 0, 255, 0.4))', top: 0, left: 0, width: '100%', height: '10rem', boxSizing: 'border-box' }}>
        <div style={{ padding: '1rem' }}>
          <SlIconButton name="person-plus" label="Add group" style={{ fontSize: '1.5rem', float: 'right' }} onClick={()=>navigate('/groups/new')} />
          <h2 style={{ clear: 'both' }}>Your groups</h2>
        </div>
      </div>
      { groupUpdateFlag ?
        <div style={{ left: 0, width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
          <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%', marginBottom: '1rem' }} />
          <SlSkeleton effect="sheen" style={{ height: '4rem', borderRadius: '0.2rem', width: '100%' }} />
        </div>
        :
        <div style={{ left: 0, width: '100%', boxSizing: 'border-box', padding: '1rem' }}>
          { lst.length > 0 ?
            lst :
            <div style={{ padding: '1rem', marginTop: '-8rem', textAlign: 'center' }}>
              <img src='arrow.png' width='60%' style={{ marginLeft: '10rem' }} alt='arrow to button' /><br/>
              You have no groups yet.<br/><br/>
              Click the button to create your first group<br/>
              or join an existing one.
            </div>
          }
        </div>
      }
    </>
  );

}