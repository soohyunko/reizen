package com.reizen.service;

import com.reizen.domain.User;

public interface UserService {

  public User checkUser(User user) throws Exception;
  public User getUser(int no);
  public int addUser(User user);
  public String checkMail(String email) throws Exception;
  public int updateUser(User user);
  public int deleteUser(int no);
  public User googleCheck(User user);
}
