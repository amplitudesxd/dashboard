import React, {useEffect, useRef, useState} from 'react';
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "typesafe-actions";
import { actions as peerActions } from '../store/peer';
import {
    Col,
    Row,
    Typography,
    Space,
    Button, Drawer, Form, Select, Tag, Divider
} from "antd";
import type { CustomTagProps } from 'rc-select/lib/BaseSelect'
import {useAuth0} from "@auth0/auth0-react";
import {PeerGroupsToSave} from "../store/peer/types";
import {Group, GroupPeer} from "../store/group/types";

const { Paragraph } = Typography;
const { Option } = Select;

const PeerGroupsUpdate = () => {
    const { getAccessTokenSilently } = useAuth0()
    const dispatch = useDispatch()
    const groups =  useSelector((state: RootState) => state.group.data)
    const peer =   useSelector((state: RootState) => state.peer.peer)
    const updateGroupsVisible = useSelector((state: RootState) => state.peer.updateGroupsVisible)
    const savedGroups = useSelector((state: RootState) => state.peer.savedGroups)

    const [tagGroups, setTagGroups] = useState([] as string[])
    const [selectedTagGroups, setSelectedTagGroups] = useState([] as string[])
    const [peerGroups, setPeerGroups] = useState([] as GroupPeer[])
    const [peerGroupsToSave, setPeerGroupsToSave] = useState({
        ID: '',
        groupsNoId: [],
        groupsToSave: [],
        groupsToRemove: [],
        groupsToAdd: []
    } as PeerGroupsToSave)

    const [form] = Form.useForm()

    useEffect(() => {
        if (!peer) return
        const gs = peer?.groups?.map(g => ({id: g?.id || '', name: g.name} as GroupPeer)) as GroupPeer[]
        const gs_name = gs?.map(g => g.name) as string[]
        setPeerGroups(gs)
        setSelectedTagGroups(gs_name)
        form.setFieldsValue({
            groups: gs_name
        })
    }, [peer])

    useEffect(() => {
        setTagGroups(groups?.map(g => g.name) || [])
    }, [groups])

    useEffect(() => {
        const groupsToRemove = peerGroups.filter(pg => !selectedTagGroups.includes(pg.name)).map(g => g.id)
        const groupsToAdd = (groups as Group[]).filter(g => selectedTagGroups.includes(g.name) && !groupsToRemove.includes(g.id || '') && !peerGroups.find(pg => pg.id === g.id)).map(g => g.id) as string[]
        const groupsNoId = selectedTagGroups.filter(stg => !groups.find(g => g.name === stg))
        setPeerGroupsToSave({
            ...peerGroupsToSave,
            ID: peer?.id || '',
            groupsToRemove,
            groupsToAdd,
            groupsNoId
        })
    }, [selectedTagGroups])

    const tagRender = (props: CustomTagProps) => {
        const { label, value, closable, onClose } = props;
        const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();
            event.stopPropagation();
        };

        return (
            <Tag
                color="blue"
                onMouseDown={onPreventMouseDown}
                closable={closable}
                onClose={onClose}
                style={{ marginRight: 3 }}
            >
                <strong>{value}</strong>
            </Tag>
        );
    }

    const optionRender = (label: string) => {
        let peersCount = ''
        const g = groups.find(_g => _g.name === label)
        if (g)  peersCount = ` - ${g.peers_count || 0} ${(!g.peers_count || parseInt(g.peers_count) !== 1) ? 'peers' : 'peer'} `
        return (
            <>
                <Tag
                    color="blue"
                    style={{ marginRight: 3 }}
                >
                    <strong>{label}</strong>
                </Tag>
                <span style={{fontSize: ".85em"}}>{peersCount}</span>
            </>
        )
    }

    const dropDownRender = (menu: React.ReactElement) => (
        <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <Row style={{padding: '0 8px 4px'}}>
                <Col flex="auto">
                    <span style={{color: "#9CA3AF"}}>Add new group by pressing "Enter"</span>
                </Col>
                <Col flex="none">
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.70455 7.19176V5.89915H10.3949C10.7727 5.89915 11.1174 5.80634 11.429 5.62074C11.7405 5.43513 11.9875 5.18655 12.1697 4.875C12.3554 4.56345 12.4482 4.21875 12.4482 3.84091C12.4482 3.46307 12.3554 3.12003 12.1697 2.81179C11.9841 2.50024 11.7356 2.25166 11.424 2.06605C11.1158 1.88044 10.7727 1.78764 10.3949 1.78764H9.83807V0.5H10.3949C11.0114 0.5 11.5715 0.650805 12.0753 0.952414C12.5791 1.25402 12.9818 1.65672 13.2834 2.16051C13.585 2.6643 13.7358 3.22443 13.7358 3.84091C13.7358 4.30161 13.648 4.73414 13.4723 5.13849C13.3 5.54285 13.0613 5.89915 12.7564 6.20739C12.4515 6.51562 12.0968 6.75758 11.6925 6.93324C11.2881 7.10559 10.8556 7.19176 10.3949 7.19176H1.70455ZM4.90128 11.0646L0.382102 6.54545L4.90128 2.02628L5.79119 2.91619L2.15696 6.54545L5.79119 10.1747L4.90128 11.0646Z" fill="#9CA3AF"/>
                    </svg>
                </Col>
            </Row>
        </>
    )

    const setUpdateGroupsVisible = (status:boolean) => {
        dispatch(peerActions.setUpdateGroupsVisible(status));
    }

    const onCancel = () => {
        dispatch(peerActions.setPeer(null))
        setUpdateGroupsVisible(false)
    }

    const onChange = (data:any) => {
        //setFormRule({...formRule, ...data})
    }

    const handleChangeTags = (value: string[]) => {
        setSelectedTagGroups(value)
    };

    const handleFormSubmit = () => {
        form.validateFields()
            .then((values) => {
                dispatch(peerActions.saveGroups.request({getAccessTokenSilently, payload: peerGroupsToSave}))
            })
            .catch((errorInfo) => {
                console.log('errorInfo', errorInfo)
            });
    }

    return (
        <>
            {peer &&
                <Drawer
                    title={`${peer.name}`}
                    forceRender={true}
                    visible={true}
                    bodyStyle={{paddingBottom: 80}}
                    onClose={onCancel}
                    autoFocus={true}
                    footer={
                        <Space style={{display: 'flex', justifyContent: 'end'}}>
                            <Button onClick={onCancel} disabled={savedGroups.loading}>Cancel</Button>
                            <Button type="primary" disabled={savedGroups.loading || (!peerGroupsToSave.groupsToRemove.length && !peerGroupsToSave.groupsToAdd.length && !peerGroupsToSave.groupsNoId.length)} onClick={handleFormSubmit}>Save</Button>
                        </Space>
                    }
                >
                    <Form layout="vertical" hideRequiredMark form={form} onValuesChange={onChange}>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="groups"
                                    label="Groups"
                                    rules={[{required: true, message: 'Please enter ate least one group'}]}
                                    style={{display: 'flex'}}
                                >
                                    <Select mode="tags"  style={{ width: '100%' }} placeholder="Select groups..." tagRender={tagRender} dropdownRender={dropDownRender} onChange={handleChangeTags}>
                                        {
                                            tagGroups.map(m =>
                                                <Option key={m}>{optionRender(m)}</Option>
                                            )
                                        }
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Drawer>
            }
        </>
    )
}

export default PeerGroupsUpdate